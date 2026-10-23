// src/components/pages/public/AdvancedSearchForm.js
// Shared advanced-search pieces used by Listing.js and AdvanceSearch.js:
// the filter form, the salary filter logic, URL <-> filter helpers,
// the profile result cards and the pager.
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Profiles from '../../templates/ImagesLoader';
import jsonArr from '../../templates/data/jsonData';
import { imageUrl } from '../../../utils/imageUrl';
import { searchUsers } from '../../../services/listingService';
import '../../../assets/css/pages/listing.css';

export const LISTING_LIMIT = 10;

// Remember scroll position so Listing can restore it after returning from ProfileDetails
const rememberListingPosition = (page) => {
  sessionStorage.setItem('listingScrollY', String(window.scrollY));
  sessionStorage.setItem('listingScrollPage', String(page));
};

// Build the search filters from the URL query string
export const getSearchFiltersFromParams = (searchParams, USERGENDER) => {
  const filters = {};
  // const gender = searchParams.get('gender');
  const gender = (USERGENDER !== "") ? (USERGENDER === "Male" ? "Female" : "Male") : searchParams.get('gender');
  const ageFrom = searchParams.get('ageFrom');
  const ageTo = searchParams.get('ageTo');
  const maritalStatus = searchParams.get('maritalStatus');
  const heightFrom = searchParams.get('heightFrom');
  const caste = searchParams.get('caste');
  const state = searchParams.get('state');
  const city = searchParams.get('city');
  const education = searchParams.get('education');
  const annualIncome = searchParams.get('annualIncome');
  const occupation = searchParams.get('occupation');
  const workingLocation = searchParams.get('workingLocation');

  if (gender) filters.gender = gender;
  if (ageFrom) filters.ageFrom = ageFrom;
  if (ageTo) filters.ageTo = ageTo;
  if (maritalStatus) filters.maritalStatus = maritalStatus;
  if (heightFrom) filters.heightFrom = heightFrom;
  if (caste) filters.caste = caste;
  if (state) filters.state = state;
  if (city) filters.city = city;
  if (education) filters.education = education;
  if (annualIncome) filters.annualIncome = annualIncome;
  if (occupation) filters.occupation = occupation;
  if (workingLocation) filters.workingLocation = workingLocation;
  return filters;
};

// Build URL query params from a filter object (always resets to page 1)
export const buildSearchParams = (filters) => {
  const params = new URLSearchParams();
  params.set('page', '1'); // Reset to page 1 on new search

  Object.keys(filters).forEach(key => {
    if (filters[key] && filters[key] !== '' && filters[key] !== '0') {
      params.set(key, filters[key]);
    }
  });
  console.log("data added", params.get('ageFrom'), params.get('ageTo'), params.get('gender'), params.get('maritalStatus'), params.get('caste'), params.get('state'), params.get('city'), params.get('heightFrom'), params.get('education'),
    params.get('annualIncome'), params.get('occupation'), params.get('workingLocation')
  );
  return params;
};

// Read a <form> into a filter object (empty values removed, gender/salary applied)
export const collectSearchFormData = (formEl, oppositeGender, salary) => {
  const fd = new FormData(formEl);
  const dataObj = Object.fromEntries(fd.entries());

  // Remove empty values
  Object.keys(dataObj).forEach(key => {
    if (dataObj[key] === '' || dataObj[key] === '0') {
      delete dataObj[key];
    }
  });

  // If user is logged in, automatically set gender to opposite
  if (oppositeGender) {
    dataObj.gender = oppositeGender;
  }

  // Add salary package if both fields are filled
  const annualIncome = salary.annualIncome();
  if (annualIncome) {
    dataObj.annualIncome = annualIncome;
  }
  return dataObj;
};

// Calls the search service and normalises the response
export const runProfileSearch = async (searchFilters, page, limit) => {
  const resp = await searchUsers(searchFilters, page, limit);
  const payload = resp.data || {};
  const rows = Array.isArray(payload) ? payload : (payload.data || payload.rows || []);
  const total = payload.total != null ? Number(payload.total) : rows.length;
  return { rows, total };
};

export const withProfileImages = (rows) => rows.map(user => ({
  ...user,
  profileImage: user.profile_image_thumb || user.profile_image || Profiles.notfound
}));

export const getResultRange = (page, totalRecords, limit = LISTING_LIMIT) => {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRecords);
  return { start, end };
};

// Salary filter state + handlers (shared by the form and the quick search bar)
export const useSalaryFilter = () => {
  const [num, setNum] = useState("");
  const [units, setUnits] = useState("Lakhs");
  const [message, setMessage] = useState("");

  const updateMessage = (n, u) => {
    if (n && u) {
      setMessage(`Searching for: ${n} ${u} per Annum`);
    } else {
      setMessage("");
    }
  };

  const handleNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {  // Only numbers
      setNum(value);
      updateMessage(value, units);
    }
  };

  const handleUnitsChange = (event) => {
    const value = event.target.value;
    setUnits(value);
    updateMessage(num, value);
  };

  const reset = () => {
    setNum("");
    setUnits("Lakhs");
    setMessage("");
  };

  const annualIncome = () => (num && units) ? `${num} ${units}` : null;

  return { num, units, message, handleNumChange, handleUnitsChange, reset, annualIncome };
};

// Advanced filter form (sidebar fields on Listing, card body on Advanced Search)
export const AdvancedSearchForm = ({ className = 'lst-sidebar-card lst-filters', showGenderField, oppositeGender, salary, onSubmit }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(collectSearchFormData(e.target, oppositeGender, salary));
  };

  return (
    <form className={className} onSubmit={handleSubmit}>
      {showGenderField && (
        <div className="lst-field">
          <label className="lst-label">Bride/Groom</label>
          <select name="gender" className="form-control" id="select">
            <option value="">-- No Preference --</option>
            <option value="Male">Groom(Boy)</option>
            <option value="Female" selected="selected">Bride(Girl)</option>
          </select>
        </div>
      )}
      <div className="lst-field">
        <label className="lst-label">Age From</label>
        <select name="ageFrom" className="form-control">
          <option value="0">From</option>
          <option value="18" selected="">18</option>
          <option value="19">19</option>
          <option value="20">20</option>
          <option value="21">21</option>
          <option value="22">22</option>
          <option value="23">23</option>
          <option value="24">24</option>
          <option value="25">25</option>
          <option value="26">26</option>
          <option value="27">27</option>
          <option value="28">28</option>
          <option value="29">29</option>
          <option value="30">30</option>
          <option value="31">31</option>
          <option value="32">32</option>
          <option value="33">33</option>
          <option value="34">34</option>
          <option value="35">35</option>
          <option value="36">36</option>
          <option value="37">37</option>
          <option value="38">38</option>
          <option value="39">39</option>
          <option value="40">40</option>
          <option value="41">41</option>
          <option value="42">42</option>
          <option value="43">43</option>
          <option value="44">44</option>
          <option value="45">45</option>
          <option value="46">46</option>
          <option value="47">47</option>
          <option value="48">48</option>
          <option value="49">49</option>
          <option value="50">50</option>
          <option value="51">51</option>
          <option value="52">52</option>
          <option value="53">53</option>
          <option value="54">54</option>
          <option value="55">55</option>
          <option value="56">56</option>
          <option value="57">57</option>
          <option value="58">58</option>
          <option value="59">59</option>
          <option value="60">60</option>
          <option value="61">61</option>
          <option value="62">62</option>
          <option value="63">63</option>
          <option value="64">64</option>
          <option value="65">65</option>
          <option value="66">66</option>
          <option value="67">67</option>
          <option value="68">68</option>
          <option value="69">69</option>
          <option value="70">70</option>
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">Age To</label>
        <select name="ageTo" className="form-control">
          <option value="0">To</option>
          <option value="19">19</option>
          <option value="20">20</option>
          <option value="21">21</option>
          <option value="22">22</option>
          <option value="23">23</option>
          <option value="24">24</option>
          <option value="25">25</option>
          <option value="26">26</option>
          <option value="27">27</option>
          <option value="28" selected="">28</option>
          <option value="29">29</option>
          <option value="30">30</option>
          <option value="31">31</option>
          <option value="32">32</option>
          <option value="33">33</option>
          <option value="34">34</option>
          <option value="35">35</option>
          <option value="36">36</option>
          <option value="37">37</option>
          <option value="38">38</option>
          <option value="39">39</option>
          <option value="40">40</option>
          <option value="41">41</option>
          <option value="42">42</option>
          <option value="43">43</option>
          <option value="44">44</option>
          <option value="45">45</option>
          <option value="46">46</option>
          <option value="47">47</option>
          <option value="48">48</option>
          <option value="49">49</option>
          <option value="50">50</option>
          <option value="51">51</option>
          <option value="52">52</option>
          <option value="53">53</option>
          <option value="54">54</option>
          <option value="55">55</option>
          <option value="56">56</option>
          <option value="57">57</option>
          <option value="58">58</option>
          <option value="59">59</option>
          <option value="60">60</option>
          <option value="61">61</option>
          <option value="62">62</option>
          <option value="63">63</option>
          <option value="64">64</option>
          <option value="65">65</option>
          <option value="66">66</option>
          <option value="67">67</option>
          <option value="68">68</option>
          <option value="69">69</option>
          <option value="70">70</option>
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">Marital Status</label>
        <select name="maritalStatus" className="form-control" id="maritalstatus">
          <option value="">-- No Preference --</option>
          <option value="Single">Never Married</option>
          <option value="Widowed">Widowed</option>
          <option value="Divorced">Divorced</option>
          <option value="Awaiting Divorce">Awaiting Divorce</option>
        </select>
      </div>

      <div className="lst-field">
        <label className="lst-label">Height</label>
        <select name="heightFrom" className="form-control" id="height" >
          <option value="">-- No Preference --</option>
          {jsonArr.heightData.map((res, i) => <option key={i} value={res.heightlabel}>{res.heightlabel}</option>)}
        </select>
      </div>
      <div className="lst-field lst-check">
        <input type="checkbox" name="checkname" id="3dgraphic" />
        <label htmlFor="3dgraphic">Only with pictures X</label>
      </div>
      <div className="lst-field">
        <label className="lst-label">State</label>
        <select name="state" className="form-control" >
          <option value="">-- No Preference --</option>
          {jsonArr.states.map((res, i) => <option key={i} value={res.state}>{res.state}</option>)}
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">City</label>
        <select name="city" className="form-control" id="city">
          <option value="">-- No Preference --</option>
          {jsonArr.districtData.map((res, i) => <option key={i} value={res.districtlabel}>{res.districtlabel}</option>)}
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">Caste</label>
        <select name="caste" className="form-control" id="caste">
          <option value="">-- No Preference --</option>
          {jsonArr.casteData.map((res, i) => <option key={i} value={res.castelabel}>{res.castelabel}</option>)}
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">Education</label>
        <select name="education" className="form-control" id="education">
          <option value="">-- No Preference --</option>
          <option value="Middle School">Middle School</option>
          <option value="Intermediates">Intermediates</option>
          <option value="Bachelors">Bachelors</option>
          <option value="Masters">Masters</option>
          <option value="Doctorate">Doctorate</option>
          <option value="Uneducated">Uneducated</option>
          <option value="Diploma">Diploma</option>
          <option value="ITI">ITI</option>
          <option value="BTech">BTech</option>
          <option value="MTech">MTech</option>
          <option value="MBBS">MBBS</option>
          <option value="BPharm">BPharm</option>
          <option value="M.Pharm">M.Pharm</option>
          <option value="BSc">BSc</option>
          <option value="BSc Nursing">BSc Nursing</option>
          <option value="BSc Agriculture">BSc Agriculture</option>
          <option value="BA">BA</option>
          <option value="BCom">BCom</option>
          <option value="MBA">MBA</option>
          <option value="B.E.">B.E.</option>
          <option value="M.E.">M.E.</option>
          <option value="B.Sc">B.Sc</option>
          <option value="M.Sc">M.Sc</option>
          <option value="BBA">BBA</option>
          <option value="BCA">BCA</option>
          <option value="MCA">MCA</option>
          <option value="B.Arch">B.Arch</option>
          <option value="B.Ed">B.Ed</option>
          <option value="LLB">LLB</option>
          <option value="BAMS">BAMS</option>
          <option value="BHMS">BHMS</option>
          <option value="BDS">BDS</option>
          <option value="M.Ed">M.Ed</option>
          <option value="MSW">MSW</option>
          <option value="MPT">MPT</option>
          <option value="MDS">MDS</option>
          <option value="M.Ch">M.Ch</option>
          <option value="DM">DM</option>
          <option value="M.Sc Nursing">M.Sc Nursing</option>
          <option value="M.Sc Agri">M.Sc Agri</option>
          <option value="PhD">PhD</option>
          <option value="CA">CA</option>
          <option value="ICWA">ICWA</option>
          <option value="CMA">CMA</option>
          <option value="CS">CS</option>
          <option value="CFA">CFA</option>
          <option value="Pursuing UG">Pursuing UG</option>
          <option value="Pursuing PG">Pursuing PG</option>
        </select>
      </div>
      <div className="lst-field">
        <label className="lst-label">Occupation</label>
        <select name="occupation" className="form-control" id="occupation">
          <option value="">-- No Preference --</option>
          {jsonArr.occupationData.map((res, i) => <option key={i} value={res.occupation}>{res.occupation}</option>)}
        </select>
      </div>
      {/* Salary Amount Input */}
      <div className="lst-field">
        <label className="lst-label">Salary Amount</label>
        <input
          type="text"
          value={salary.num}
          onChange={salary.handleNumChange}
          className="form-control"
          placeholder="e.g., 5 or 10.5"
        />
      </div>

      {/* Salary Units Dropdown */}
      <div className="lst-field">
        <label className="lst-label">Salary Unit</label>
        <select
          value={salary.units}
          onChange={salary.handleUnitsChange}
          className="form-control"
        >
          <option value="Thousands">Thousands</option>
          <option value="Lakhs">Lakhs</option>
          <option value="Crores">Crores</option>
        </select>
      </div>

      {/* Display Message */}
      {salary.message && (
        <div className="lst-field">
          <p className="lst-salary-msg">
            {salary.message}
          </p>
        </div>
      )}
      <div className="lst-field">
        <label className="lst-label">Working Location X</label>
        <select name="workingLocation" className="form-control" id="working_location">
          <option value="">-- No Preference --</option>

          <option value="UK">UK</option>
          <option value="USA">USA</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Ahmedabad">Ahmedabad</option>
          <option value="Bhopal">Bhopal</option>
          <option value="Bhubaneswar">Bhubaneswar</option>
          <option value="Chandigarh">Chandigarh</option>
          <option value="Chennai">Chennai</option>
          <option value="Coimbatore">Coimbatore</option>
          <option value="Dehradun">Dehradun</option>
          <option value="Delhi-NCR">Delhi-NCR (incl. Gurugram, Noida)</option>
          <option value="Goa">Goa</option>
          <option value="Guwahati">Guwahati</option>
          <option value="Indore">Indore</option>
          <option value="Jaipur">Jaipur</option>
          <option value="Kochi">Kochi</option>
          <option value="Kolkata">Kolkata</option>
          <option value="Lucknow">Lucknow</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Mysuru">Mysuru</option>
          <option value="Nagpur">Nagpur</option>
          <option value="Nashik">Nashik</option>
          <option value="Patna">Patna</option>
          <option value="Pune">Pune</option>
          <option value="Raipur">Raipur</option>
          <option value="Ranchi">Ranchi</option>
          <option value="Surat">Surat</option>
          <option value="Thiruvananthapuram">Thiruvananthapuram</option>
          <option value="Vadodara">Vadodara</option>
          <option value="Visakhapatnam">Visakhapatnam (Vizag)</option>

          <option value="Australia">Australia</option>
          <option value="Canada">Canada</option>
          <option value="Germany">Germany</option>
          <option value="Ireland">Ireland</option>
          <option value="Kuwait">Kuwait</option>
          <option value="Malaysia">Malaysia</option>
          <option value="Netherlands">Netherlands</option>
          <option value="New Zealand">New Zealand</option>
          <option value="Oman">Oman</option>
          <option value="Qatar">Qatar</option>
          <option value="Saudi Arabia">Saudi Arabia</option>
          <option value="Singapore">Singapore</option>
          <option value="UAE">UAE</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="lst-field lst-field--submit">
        <input type="submit" value="Search" className="sub" />
      </div>
    </form>
  );
};

// Profile result cards (same markup on Listing and Advanced Search)
export const ProfileCards = ({ userList, page }) => (
  <div className="listing">
    <ul className="lst-grid">
      {userList.length > 0 ? (
        userList.map(res => (
          <li className="lst-card" key={res.uid}>
            <div className="lst-card__photo">
              <img
                src={imageUrl(res.profileImage)}
                alt=""
              />
            </div>

            <div className="lst-card__body">
              <h3 className="lst-card__name">
                <Link
                  to={`/ProfileDetails/${res.uid}`}
                  className="lst-card__link"
                  onClick={() => rememberListingPosition(page)}
                >
                  MAT{res.uid}
                </Link>
                -
                <Link
                  to={`/ProfileDetails/${res.uid}`}
                  className="lst-card__link"
                  onClick={() => rememberListingPosition(page)}
                >
                  {res.ufname}
                </Link>
              </h3>
              <ul className="lst-facts">
                <li title="Age">
                  <i className="far fa-calendar-alt"></i>
                  {res.udob
                    ? res.udob.split("/")[1] + '/' + res.udob.split("/")[0] + '/' + res.udob.split("/")[2]
                    : "Not Available"}
                </li>
                <li title="Location">
                  <i className="fas fa-map-marker-alt"></i> {res.familyresidence}
                </li>
                <li title="Gender">
                  <i className="fas fa-female"></i> {res.ugender}
                </li>
                <li title="Education">
                  <i className="fas fa-book-open"></i> {res.ujob}
                </li>
                <li title="Marital Status">
                  <i className="fas fa-ring"></i> {res.maritalstatus}
                </li>
                <li title="Height">
                  <i className="fas fa-male"></i> {res.uheight} Ft
                </li>
              </ul>
              <p className="lst-card__about">{res.about}</p>
            </div>
            <div className="lst-card__actions">
              <Link
                to={`/ProfileDetails/${res.uid}`}
                className="lst-btn lst-btn--primary"
                onClick={() => rememberListingPosition(page)}
              >
                <i className="fas fa-paper-plane" aria-hidden="true"></i> Details
              </Link>
            </div>
          </li>
        ))
      ) : (
        <li className="lst-empty-item">
          <div className="lst-empty">
            <i className="fas fa-user-slash" aria-hidden="true"></i>
            <p>No profiles found matching your criteria.</p>
          </div>
        </li>
      )}
    </ul>
  </div>
);

// Pagination control (page numbers + previous/next arrows)
export const ProfilePager = ({ page, totalPages, onPageChange }) => {
  const renderPageButtons = () => {
    if (!totalPages || totalPages <= 1) return null;

    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    // First page
    if (startPage > 1) {
      buttons.push(
        <a
          href="#0"
          key={1}
          className="lst-page-btn"
          onClick={(e) => { e.preventDefault(); onPageChange(1); }}
        >
          1
        </a>
      );
      if (startPage > 2) {
        buttons.push(<span key="dots1" className="lst-page-dots">...</span>);
      }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <a
          href="#0"
          key={i}
          className={`lst-page-btn ${i === page ? 'is-active' : ''}`}
          onClick={(e) => { e.preventDefault(); onPageChange(i); }}
        >
          {i}
        </a>
      );
    }

    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="dots2" className="lst-page-dots">...</span>);
      }
      buttons.push(
        <a
          href="#0"
          key={totalPages}
          className="lst-page-btn"
          onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}
        >
          {totalPages}
        </a>
      );
    }

    return buttons;
  };

  return (
    <div className="lst-pager">
      <a
        href="#0"
        onClick={(e) => {
          e.preventDefault();
          if (page > 1) onPageChange(page - 1);
        }}
        className={`lst-pager__btn${page === 1 ? ' is-disabled' : ''}`}
        aria-label="Previous"
      >
        <i className="fas fa-angle-left"></i>
      </a>

      {totalPages > 0 ? renderPageButtons() : (
        <a
          href="#0"
          onClick={(e) => e.preventDefault()}
          className="lst-page-btn is-active lst-page-btn--label"
        >
          {`Page ${page}`}
        </a>
      )}

      <a
        href="#0"
        onClick={(e) => {
          e.preventDefault();
          if (page < totalPages) onPageChange(page + 1);
        }}
        className={`lst-pager__btn${page === totalPages ? ' is-disabled' : ''}`}
        aria-label="Next"
      >
        <i className="fas fa-angle-right"></i>
      </a>
    </div>
  );
};
