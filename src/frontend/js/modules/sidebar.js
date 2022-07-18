import { Storage } from '../utils/storage';
import Shortcut from '@codexteam/shortcuts';

/**
 * Local storage key
 */
const LOCAL_STORAGE_KEY = 'docs_sidebar_state';
const SIDEBAR_VISIBILITY_KEY = 'docs_sidebar_visibility';


/**
 * Section list item height in px
 */
const ITEM_HEIGHT = 31;

/**
 * Sidebar module
 */
export default class Sidebar {
  /**
   * CSS classes
   *
   * @returns {Record<string, string>}
   */
  static get CSS() {
    return {
      toggler: 'docs-sidebar__section-toggler',
      section: 'docs-sidebar__section',
      sectionCollapsed: 'docs-sidebar__section--collapsed',
      sectionAnimated: 'docs-sidebar__section--animated',
      sectionTitle: 'docs-sidebar__section-title',
      sectionTitleActive: 'docs-sidebar__section-title--active',
      sectionList: 'docs-sidebar__section-list',
      sectionListItemActive: 'docs-sidebar__section-list-item--active',
      sidebarToggler: 'docs-sidebar__toggler',
      sidebarSlider: 'docs-sidebar__slider',
      sidebarCollapsed: 'docs-sidebar--collapsed',
      sidebarAnimated: 'docs-sidebar--animated',
      sidebarContent: 'docs-sidebar__content',
      sidebarContentHidden: 'docs-sidebar__content--hidden',
      sidebarContentInvisible: 'docs-sidebar__content--invisible',
    };
  }

  /**
   * Creates base properties
   */
  constructor() {
    /**
     * Stores refs to HTML elements needed for correct sidebar work
     */
    this.nodes = {
      sidebar: null,
      sections: [],
      sidebarContent: null,
      toggler: null,
      slider: null,
    };
    this.sidebarStorage = new Storage(LOCAL_STORAGE_KEY);
    const storedState = this.sidebarStorage.get();

    this.sectionsState = storedState ? JSON.parse(storedState) : {};

    this.sidebarVisibilityStorage = new Storage(SIDEBAR_VISIBILITY_KEY);
    const storedVisibility = this.sidebarVisibilityStorage.get();

    this.visibility = storedVisibility !== 'false';
  }

  /**
   * Called by ModuleDispatcher to initialize module from DOM
   *
   * @param {writingSettings} settings - module settings
   * @param {HTMLElement} moduleEl - module element
   */
  init(settings, moduleEl) {
    this.nodes.sidebar = moduleEl;
    this.nodes.sections = Array.from(moduleEl.querySelectorAll('.' + Sidebar.CSS.section));
    this.nodes.sections.forEach(section => this.initSection(section));
    this.nodes.sidebarContent = moduleEl.querySelector('.' + Sidebar.CSS.sidebarContent);
    this.nodes.toggler = moduleEl.querySelector('.' + Sidebar.CSS.sidebarToggler);
    this.nodes.toggler.addEventListener('click', () => this.toggleSidebar());
    this.nodes.slider = moduleEl.querySelector('.' + Sidebar.CSS.sidebarSlider);
    this.nodes.slider.addEventListener('click', () => this.handleSliderClick());
    this.ready();
  }

  /**
   * Initializes sidebar sections: applies stored state and adds event listeners
   *
   * @param {HTMLElement} section
   * @returns {void}
   */
  initSection(section) {
    const id = section.dataset.id;
    const togglerEl = section.querySelector('.' + Sidebar.CSS.toggler);

    if (!togglerEl) {
      return;
    }

    togglerEl.addEventListener('click', e => this.handleSectionTogglerClick(id, section, e));

    if (typeof this.sectionsState[id] === 'undefined') {
      this.sectionsState[id] = false;
    }
    if (this.sectionsState[id]) {
      this.setSectionCollapsed(section, true, false);
    }

    /**
     * Calculate and set sections list max height for smooth animation
     */
    const sectionList = section.querySelector('.' + Sidebar.CSS.sectionList);

    if (!sectionList) {
      return;
    }

    const itemsCount = sectionList.children.length;

    sectionList.style.maxHeight = `${ itemsCount * ITEM_HEIGHT }px`;
  }

  /**
   * Toggles section expansion
   *
   * @param {number} sectionId - id of the section to toggle
   * @param {HTMLElement} sectionEl - section html element
   * @param {MouseEvent} event - click event
   * @returns {void}
   */
  handleSectionTogglerClick(sectionId, sectionEl, event) {
    event.preventDefault();
    this.sectionsState[sectionId] = !this.sectionsState[sectionId];
    this.sidebarStorage.set(JSON.stringify(this.sectionsState));
    this.setSectionCollapsed(sectionEl, this.sectionsState[sectionId]);
  }

  /**
   * Updates section's collapsed state
   *
   * @param {HTMLElement} sectionEl - element of the section to toggle
   * @param {boolean} collapsed - new collapsed state
   * @param {boolean} [animated] - true if state should change with animation
   */
  setSectionCollapsed(sectionEl, collapsed, animated = true) {
    const sectionList = sectionEl.querySelector('.' + Sidebar.CSS.sectionList);

    if (!sectionList) {
      return;
    }
    sectionEl.classList.toggle(Sidebar.CSS.sectionAnimated, animated);
    sectionEl.classList.toggle(Sidebar.CSS.sectionCollapsed, collapsed);

    /**
     * Highlight section item as active if active child item is collapsed.
     */
    const activeSectionListItem = sectionList.querySelector('.' + Sidebar.CSS.sectionListItemActive);
    const sectionTitle = sectionEl.querySelector('.' + Sidebar.CSS.sectionTitle);

    if (!activeSectionListItem) {
      return;
    }
    if (collapsed && animated) {
      /**
       * Highlights section title as active with a delay to let section collapse animation finish first
       */
      setTimeout(() => {
        sectionTitle.classList.toggle(Sidebar.CSS.sectionTitleActive, collapsed);
      }, 200);
    } else {
      sectionTitle.classList.toggle(Sidebar.CSS.sectionTitleActive, collapsed);
    }
  }

  /**
   * Toggles sidebar visibility
   *
   * @returns {void}
   */
  toggleSidebar() {
    this.nodes.sidebarContent.classList.toggle(Sidebar.CSS.sidebarContentHidden);
  }

  /**
   * Initializes sidebar
   *
   * @returns {void}
   */
  initSidebar() {
    if (!this.visibility) {
      this.nodes.slider.classList.add(Sidebar.CSS.sidebarSliderHidden);
      this.nodes.sidebar.classList.add(Sidebar.CSS.sidebarCollapsed);
    }

    // prevent sidebar animation on page load
    setTimeout(() => {
      this.nodes.sidebar.classList.add(Sidebar.CSS.sidebarAnimated);
    }, 200);

    // add shortcut to slide sidebar
    const shortcutForSlider = new Shortcut({
      name: 'CMD+SHIFT+S',
      on: document.body,
      callback: () => this.handleSliderClick(),
    });
  }

  /**
   * Slides sidebar
   *
   * @returns {void}
   */
  handleSliderClick() {
    this.visibility = !this.visibility;
    this.sidebarVisibilityStorage.set(this.visibility);
    this.nodes.sidebar.classList.toggle(Sidebar.CSS.sidebarCollapsed);
  }

  /**
   * Displays sidebar when ready
   *
   * @returns {void}
   */
  ready() {
    this.initSidebar();
    this.nodes.sidebarContent.classList.remove(Sidebar.CSS.sidebarContentInvisible);
  }
}
