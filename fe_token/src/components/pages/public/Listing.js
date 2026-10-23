


import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useLocation } from "react-router-dom"
import Profiles from "../../templates/ImagesLoader"
import api from '../../../utils/api'
import '../../../assets/css/pages/listing.css';

import {
  fetchUserDetails,
  // fetchUserGallery
} from '../../../services/userService';

import {
  getAllUsers,
  // getPublicProfile,
  // getPublicGallery
} from '../../../services/listingService';

import {
  LISTING_LIMIT,
  AdvancedSearchForm,
  ProfileCards,
  ProfilePager,
  buildSearchParams,
  collectSearchFormData,
  getResultRange,
  getSearchFiltersFromParams,
  runProfileSearch,
  useSalaryFilter,
  withProfileImages,
} from './AdvancedSearchForm';

const Listing = () => {
  const [userDetails, setUserDetails] = useState({});
  const [userList, setUserList] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const LIMIT = LISTING_LIMIT;
  const USERGENDER = localStorage.getItem("userGender");
  const userId = localStorage.getItem("userId");
  // Salary filter state (shared with the advanced search form)
  const salary = useSalaryFilter();
  // Advanced Search panel expand/collapse — MOBILE ONLY (desktop stays as before).
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  // On desktop the filter form is always visible; on mobile it's controlled by the toggle.
  const showSearchForm = !isMobile || advancedOpen;
  useEffect(() => {
    // Check if localStorage keys exist, if not set them by default facing issue of male in new systems
    if (!localStorage.getItem("userGender")) {
      localStorage.setItem("userGender", ""); // empty means no filter
    }
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", ""); // empty means no login
    }
  }, []);

  // Get page from URL, default to 1
  const page = Number(searchParams.get('page')) || 1;

  // Opposite gender for logged-in users (applied to every submitted search)
  const oppositeGender = (userId && userDetails.ugender)
    ? (userDetails.ugender === "Male" ? "Female" : "Male")
    : null;

  // Get search filters from URL
  const searchFilters = getSearchFiltersFromParams(searchParams, USERGENDER);
  const isSearchActive = Object.keys(searchFilters).length > 0;

  // Helper to update page in URL while preserving search filters
  const updatePageInUrl = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    setSearchParams(params);
  };

  // Helper to update search filters in URL
  const updateSearchInUrl = (filters) => {
    setSearchParams(buildSearchParams(filters));
  };

  // Quick search bar (top strip) submit
  const handleQuickSearch = (e) => {
    e.preventDefault();
    updateSearchInUrl(collectSearchFormData(e.target, oppositeGender, salary));
  };

  // Fetch user details once on mount
  useEffect(() => {
    console.log("userId in listing", localStorage.getItem("userGender"))
    if (userId) {
      // api.post('/FetchUserDetails', { uid: userId })
       fetchUserDetails(userId)  // ✅ Using service function
        .then(res => setUserDetails(res.data))
        .catch(err => console.error('Error fetching user details:', err));
    }
  }, [userId]);

  // Fetch initial paginated list (when NOT searching)
  useEffect(() => {
    const fetchInitialUsers = async () => {
      try {
        // Determine opposite gender if user is logged in
        let genderParam = null;
        if (userId) {
          if (USERGENDER) {
            const g = String(USERGENDER).trim().toLowerCase();
            if (g === 'male') genderParam = 'Female';
            else if (g === 'female') genderParam = 'Male';
          } else if (userDetails.ugender) {
            genderParam = userDetails.ugender === 'Male' ? 'Female' : 'Male';
          }
        }

        const genderQuery = genderParam ? `&gender=${encodeURIComponent(genderParam)}` : '';
        // const res = await api.get(`/getAllUsers?page=${page}&limit=${LIMIT}${genderQuery}`);
            const res = await getAllUsers(page, LIMIT, genderParam);
        let rows = Array.isArray(res.data) ? res.data : (res.data.data || res.data.rows || []);
        const total = res.data.total || res.data.totalCount || res.data.count || res.data.totalRecords || rows.length;

        setTotalRecords(total);
        setTotalPages(Math.ceil(total / LIMIT));

        // ✅ Profile images are now included in the API response as profile_image_thumb
        // This eliminates 10 separate API calls per page load!
        setUserList(withProfileImages(rows));
      } catch (error) {
        console.error('Error fetching users:', error);
        setUserList([]);
        setTotalPages(0);
        setTotalRecords(0);
      }
    };

    // Only fetch initial users when NOT searching
    if (!isSearchActive && (!userId || (userId && userDetails.ugender) || USERGENDER)) {
      fetchInitialUsers();
    }
  }, [page, userId, userDetails.ugender, isSearchActive, USERGENDER]);

  // Handle search functionality
  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        const { rows, total } = await runProfileSearch(searchFilters, page, LIMIT);

        setTotalRecords(total);
        setTotalPages(Math.ceil(total / LIMIT));

        setUserList(withProfileImages(rows));
      } catch (error) {
        setUserList([]);
        setTotalPages(0);
        setTotalRecords(0);
        console.error('Error fetching search results:', error);
      }
    };

    if (isSearchActive) {
      fetchSearchResults();
    }
  }, [searchParams, page, isSearchActive]);

  const clearSearch = () => {
    // Clear all search params, keep only page=1
    setSearchParams({ page: '1' });
    // Clear salary fields
    salary.reset();
  };

  const { start, end } = getResultRange(page, totalRecords, LIMIT);
  const location = useLocation();

  // Restore scroll position when returning from ProfileDetails
  const scrollRestoredRef = useRef(false);

  // Restore scroll AFTER images finish loading
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('listingScrollY');
    const savedPage = sessionStorage.getItem('listingScrollPage');

    if (!savedScroll || !savedPage || Number(savedPage) !== page) return;
    if (scrollRestoredRef.current) return; // already restored, don't repeat

    const images = document.querySelectorAll('.listing img');

    if (images.length === 0) return;

    let loadedCount = 0;
    const totalImages = images.length;

    const tryRestore = () => {
      loadedCount++;
      if (loadedCount >= totalImages) {
        // All images loaded — now scroll
        scrollRestoredRef.current = true;
        sessionStorage.removeItem('listingScrollY');
        sessionStorage.removeItem('listingScrollPage');
        window.scrollTo({ top: Number(savedScroll), behavior: 'instant' });
      }
    };

    images.forEach(img => {
      if (img.complete) {
        tryRestore();
      } else {
        img.addEventListener('load', tryRestore, { once: true });
        img.addEventListener('error', tryRestore, { once: true }); // count broken images too
      }
    });

  }, [userList]); // fires when list renders

  // Reset the ref when page changes (user deliberately navigates to new page)
  useEffect(() => {
    scrollRestoredRef.current = false;
    // Only clear sessionStorage if this is a user-initiated page change
    // (not a back-navigation remount). We detect this by checking if
    // the saved page matches current page - if not, it's a new page nav.
    const savedPage = sessionStorage.getItem('listingScrollPage');
    if (savedPage && Number(savedPage) !== page) {
      sessionStorage.removeItem('listingScrollY');
      sessionStorage.removeItem('listingScrollPage');
    }
  }, [page]);

  return (
    <>
      <div className="pageSearch lst-quick-bar">
        <div className="container">
          <div className="lst-quick">
            <form onSubmit={handleQuickSearch}>
              <div className="lst-quick-grid">
                {!userId && (
                  <div className="lst-field lst-field--wide">
                    <select name="gender" className="form-control" defaultValue={searchFilters.gender || ''}>
                      <option value="">Looking For</option>
                      <option value="Female">Bride (Female)</option>
                      <option value="Male">Groom (Male)</option>
                    </select>
                  </div>
                )}
                <div className="lst-field">
                  <input
                    name='ageFrom'
                    type="number"
                    className="form-control"
                    placeholder="Age From"
                    defaultValue={searchFilters.ageFrom || ''}
                  />
                </div>
                <div className="lst-field">
                  <input
                    name='ageTo'
                    type="number"
                    className="form-control"
                    placeholder="Age To"
                    defaultValue={searchFilters.ageTo || ''}
                  />
                </div>
                <div className="lst-field lst-field--wide">
                  <select name="maritalStatus" className="form-control" defaultValue={searchFilters.maritalStatus || ''}>
                    <option value="">Choose one</option>
                    <option value="Single">Never Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                  </select>
                </div>
                <div className="lst-quick-action">
                  <button type="submit" className="btn">
                    <i className="fas fa-search"></i> Search
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Profiles List</h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container-fluid">
          <div className="lst-layout">
            <aside className="lst-sidebar">
              {/* Desktop: original "Quick Search" title (unchanged). */}
              {!isMobile && (
                <div className="lst-title">
                  <h1>Quick <span>Search</span></h1>
                </div>
              )}

              {/* Mobile only: Advanced Search — click to expand/collapse the filter panel */}
              {isMobile && (
                <button
                  type="button"
                  onClick={() => setAdvancedOpen(o => !o)}
                  aria-expanded={advancedOpen}
                  className={`lst-adv-toggle${advancedOpen ? ' is-open' : ''}`}
                >
                  <span><i className="fas fa-sliders-h"></i> Advanced Search</span>
                  <i className={advancedOpen ? 'fas fa-chevron-up' : 'fas fa-chevron-down'}></i>
                </button>
              )}

              {showSearchForm && (
                <AdvancedSearchForm
                  showGenderField={!userId}
                  oppositeGender={oppositeGender}
                  salary={salary}
                  onSubmit={updateSearchInUrl}
                />
              )}
            </aside>

            <section className="lst-results">
                {isSearchActive && (
                  <div className="lst-active">
                    <span>
                      Showing search results
                      {searchFilters.ageFrom && ` | Age: ${searchFilters.ageFrom}`}
                      {searchFilters.ageTo && ` - ${searchFilters.ageTo}`}
                      {searchFilters.maritalStatus && ` | Status: ${searchFilters.maritalStatus}`}
                      {searchFilters.gender && ` | Gender: ${searchFilters.gender}`}
                    </span>
                    <button className="lst-clear-btn" onClick={clearSearch}>
                      Clear Search
                    </button>
                  </div>
                )}

                <div className="lst-toolbar">
                  <div className="lst-view-toggle">
                    <a href="#" title="Result by List View" className="is-active">
                      <i className="fas fa-th-list" aria-hidden="true"></i>
                    </a>
                    <a href="#" title="Result by Gallery View">
                      <i className="fas fa-th-large" aria-hidden="true"></i>
                    </a>
                  </div>
                  <div className="lst-count">
                    Displaying Results: {userList.length > 0 ? `${start} - ${end}` : '0'} from {totalRecords} Profiles
                  </div>
                </div>

                <ProfileCards userList={userList} page={page} />

                {/* Pagination only when there are 10 or more profiles */}
                {totalRecords >= LIMIT && (
                  <ProfilePager
                    page={page}
                    totalPages={totalPages}
                    onPageChange={updatePageInUrl}
                  />
                )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default Listing;
