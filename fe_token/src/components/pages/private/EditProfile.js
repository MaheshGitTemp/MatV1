
import React, { useEffect, useState } from "react";

import api from '../../../utils/api' // <-- updated import
import { imageUrl, approvedProfileImage } from '../../../utils/imageUrl';
import { Link } from 'react-router-dom'
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
//mui
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
//ICONs
import IconButton from "@mui/material/IconButton";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import PhoneIcon from "@mui/icons-material/Phone";
import InputAdornment from "@mui/material/InputAdornment";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee"
import moment from 'moment'
import jsonArr from "../../templates/data/jsonData";
import { useToast } from '../../../components/hooks/ToastContext';
import { toTitleCase } from '../../../utils/normalizeText';
//end of icons
import {
  fetchUserDetails,
  fetchUserGallery,
  updateUserRecords,
  updateUserRegistrationDetails
} from '../../../services/userService';
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import axios from "axios";
import '../../../assets/css/pages/edit-profile.css';
import { API_BASE_URL } from '../../../utils/apiBase';

const theme = createTheme({
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#ffcccc",
          },
        },
        input: {
          "&[readonly]": {
            backgroundColor: "#f0f0f0", // Light grey color
          },
        },
      },
    },
  },
});

const countries = ["India", "United States", "Australia", "Canada", "Germany"];
const states = ["Andhra Pradesh", "Telangana"];
const MaritalStatus = ["Single", "Married", "Divorced"];
const padams = ["1", "2", "3", "4"];
const inrOptions = [{ label: "Thousand" }, { label: "Lakhs" }, { label: "Crores" }]
const diet = ["Vegeterian", "Eggitarian", "Non-vegetarian"];
const habitsOptions = ["Never", "Occasionally", "Socially", "Regularly"]
const cities = jsonArr.districtData ? jsonArr.districtData.map(res => res.districtlabel) : [];
// ["Hyderabad","Siddipet","Karimnagar","Sircilla","Vemulawada"];
const jobCities = jsonArr.jobLocationsData ? jsonArr.jobLocationsData.map(res => res.location) : [];
// ["Hyderabad","Bangalore","Pune","Chennai","Mumbai","Delhi","Kolkata","USA","UK","Canada","Other"];
const heights = jsonArr.heightData ? jsonArr.heightData.map(res => res.heightlabel) : [];
// ["5","5-1","5-2"];
const genders = ["Male", "Female"]
// const castes =["Goldsmith","Carpenter","Kamma","Kapu","Brahmin"];
const castes = jsonArr.casteData ? jsonArr.casteData.map(res => res.castelabel) : [];
const nakshtras = jsonArr.nakshatrasData ? jsonArr.nakshatrasData.map(res => res.nakshatra) : [];
// ["Ardra","Shathabhisha","Swathi","Anuradha","Vishaka"]
const rasi = jsonArr.rasiData ? jsonArr.rasiData.map(res => res.rasi) : [];
//  ["Midhuna","Simha","Tula"]
const professions = jsonArr.occupationData ? jsonArr.occupationData.map(res => res.occupation) : [];
// [ "Psychology Or Social Sciences", "Business", "Law", "Medical", "Computer & Information Technology", "Arts", "Commerce", "Engineering Technology", "Fashions", "Fine Arts", "Finance &amp; Accounting", "Education", "Architecture", "Others" ]
const degree = jsonArr.educationCourseData ? jsonArr.educationCourseData.map(res => res.course) : [];
// [ "Matriculation/O-Level", "Intermediate/A-Level", "Bachelors", "Masters", "MPhil/MS", "PHD/Doctorate", "Certification", "Diploma", "Short Course" ]

const EditProfile = () => {
  //input handler states 
  const [salaryNum, setSalaryNum] = useState("");
  const [salaryUnits, setSalaryUnits] = useState(inrOptions[1]);
  const [salaryMessage, setSalaryMessage] = useState("")
  //end of input handler states
  const [formData, setFormData] = useState(
    {
      uid: localStorage.getItem('userId'),
      fname: "", lname: "", mobile: "", email: "", gender: null, pob: null, dob: "", tob: "", caste: null, maritalStatus: null, height: null,
      country: null, state: null, city: null, about: "", nakshtra: null, padam: null, rasi: null, degree: null, profession: null, fatherName: "",
      motherName: "", brothers: "", sisters: "", brothersMarried: "", sistersMarried: "", fatherOccupation: null, motherOccupation: null,
      familyResidence: null, diet: null, habitsmoke: null, habitdrink: null, partnerPreferences: "", jobCity: null,
      package: "NA"
    });
  const [errors, setErrors] = useState({});
  const [getGallery, setGetGallery] = useState([])
  const [userDetails, setUserDetails] = useState([]);
  const userId = localStorage.getItem("userId"); // <-- define userId once

  const { showToast } = useToast();
  useEffect(() => {
    const fetchUserGallery = async () => {
      try {
        const response = await api.post(
          '/FetchUserDetails',
          { uid: userId }
        );
        setUserDetails(response.data);
      }
      catch (error) { console.error('Error fetching user details:', error); }

      try {
        const res = await api.post(
          '/GetUserGallery',
          { uid: userId }
        );
        setGetGallery(res.data);
      }
      catch (error) { console.error('Error fetching user gallery:', error); }
    };
    fetchUserGallery();
  }, [userId]);
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
    validateFields(name, value);
  };
  //salry

  const handleSalaryNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryNum(value); updateSalaryMessage(value, salaryUnits);
    }

  }; const handleSalaryUnitsChange = (event, newValue) => {
    setSalaryUnits(newValue); updateSalaryMessage(salaryNum, newValue);
  };
  const updateSalaryMessage = (num, units) => {
    if (num && units) {
      setSalaryMessage(`** ${num} ${units.label} per Annum`);
    } else { setSalaryMessage(""); }
  };
  //salry

  const handleGenderChange = (event, newValue) => { setFormData({ ...formData, gender: newValue }); validateFields('gender', newValue); };
  const handlePobChange = (event, newValue) => { setFormData({ ...formData, pob: newValue }); validateFields('pob', newValue) }
  const handleCasteChange = (event, newValue) => { setFormData({ ...formData, caste: newValue }); validateFields('caste', newValue) }
  const handleMaritalStatusChange = (event, newValue) => { setFormData({ ...formData, maritalStatus: newValue }); validateFields('maritalStatus', newValue) }
  const handleHeightChange = (event, newValue) => { setFormData({ ...formData, height: newValue }); validateFields('height', newValue) }
  const handleNakshtraChange = (event, newValue) => { setFormData({ ...formData, nakshtra: newValue }) }
  const handlePadamChange = (event, newValue) => { setFormData({ ...formData, padam: newValue }) }
  const handleRasiChange = (event, newValue) => { setFormData({ ...formData, rasi: newValue }) }
  const handleCountryChange = (event, newValue) => { setFormData({ ...formData, country: newValue }); }
  const handleStateChange = (event, newValue) => { setFormData({ ...formData, state: newValue }); }
  const handleCityChange = (event, newValue) => { setFormData({ ...formData, city: newValue }); }
  const handleDegreeChange = (event, newValue) => { setFormData({ ...formData, degree: newValue }); }
  const handleProfessionChange = (event, newValue) => { setFormData({ ...formData, profession: newValue }); }
  const handleJobCityChange = (event, newValue) => { setFormData({ ...formData, jobCity: newValue }); validateFields('jobCity', newValue) }
  const handleFatherOccupationChange = (event, newValue) => { setFormData({ ...formData, fatherOccupation: newValue }); }
  const handleFamilyResidenceChange = (event, newValue) => { setFormData({ ...formData, familyResidence: newValue }); }
  const handleMotherOccupationChange = (event, newValue) => { setFormData({ ...formData, motherOccupation: newValue }); }
  const handleDietChange = (event, newValue) => { setFormData({ ...formData, diet: newValue }); }
  const handleSmokeHabitsChange = (event, newValue) => { setFormData({ ...formData, habitsmoke: newValue }); }
  const handleDrinkHabitsChange = (event, newValue) => { setFormData({ ...formData, habitdrink: newValue }); }

  const validateFields = (name, value) => {
    const validationErrors = { ...errors };
    switch (name) {
      case "fname": validationErrors.fname = value.trim() ? "" : "First Name is required"; break;
      case "lname": validationErrors.lname = value.trim() ? "" : "Last Name is required"; break;
      case "email": validationErrors.email = value.trim()
        ? /\S+@\S+\.\S+/.test(value)
          ? "" : "Email is not valid"
        : "Email is required"; break;
      case "gender": validationErrors.gender = value ? "" : "Gender is required"; break;
      case "pob": validationErrors.pob = value ? "" : "Place of birth is required"; break;
      case 'caste': validationErrors.caste = value ? "" : "caste required."; break;
      case 'maritalStatus': validationErrors.maritalStatus = value ? "" : "Marital Status is required."; break;
      case 'jobCity': validationErrors.jobCity = value ? "" : "Job location is required"; break;
      default: break;
    } setErrors(validationErrors);
  };
  useEffect(() => {
    if (salaryNum && salaryUnits) {
      const packageValue = `${salaryNum} ${salaryUnits.label}`;
      setFormData(prev => ({
        ...prev,
        package: packageValue
      }));
    } else if (salaryNum) {
      setFormData(prev => ({
        ...prev,
        package: salaryNum
      }));
    }
  }, [salaryNum, salaryUnits]);
  useEffect(() => {
    const fetchUserData = async () => {
      try {
       
        const response = await fetchUserDetails(userId);
        if (response.data) {
          console.log("xloginmys", response.data)
          const data = response.data;
        
          setFormData(prevFormData => ({
            ...prevFormData,
            "fname": data.ufname,
            "lname": data.ulname,
            "mobile": data.uphone,
            "email": data.uemail,
            "gender": data.ugender,
            "pob": data.upob,
            "dob": data.udob,
            "tob": data.utob,
            "caste": data.ucaste,
            "maritalStatus": data.maritalstatus,
            "height": data.uheight,
            "country": data.ucountry,
            "state": data.ustate,
            "city": data.upresentloc,
            "jobCity": data.jobcity,
            "about": data.about,
            "nakshtra": data.nakshtra,
            "padam": data.padam,
            "rasi": data.rasi,
            "degree": data.degree,
            "profession": data.ujob,
            "fatherName": data.fathername,
            "motherName": data.mothername,
            "brothers": data.brothers,
            "sisters": data.sisters,
            "brothersMarried": data.brothersmarried,
            "sistersMarried": data.sistersmarried,
            "fatherOccupation": data.fatheroccupation,
            "motherOccupation": data.motheroccupation,
            "familyResidence": data.familyresidence,
            "diet": data.diet,
            "habitsmoke": data.habitsmoke,
            "habitdrink": data.habitdrink,
            "partnerPreferences": data.partnerpreferences,
            "package": data.upackage || "NA"

          }));
          if (data.upackage && data.upackage !== "NA") {
            // Try to extract number and unit from package string
            const match = data.upackage.match(/^([\d.]+)\s*(.*)$/);
            if (match) {
              setSalaryNum(match[1]);
              // Find matching unit from inrOptions
              const unit = inrOptions.find(opt =>
                match[2].toLowerCase().includes(opt.label.toLowerCase())
              );
              if (unit) {
                setSalaryUnits(unit);
              }
            }
          }

        } console.log("eeeeeeee")
      }
      catch (error) { console.error('Error fetching user details:', error); }
    }; fetchUserData();
  }, [formData.uid]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const normalizedFormData = {
  ...formData,
  fname:      toTitleCase(formData.fname),
  lname:      toTitleCase(formData.lname),
  fatherName: toTitleCase(formData.fatherName),
  motherName: toTitleCase(formData.motherName),
  about:        formData.about, // keep as-is — free text paragraph
  partnerPreferences: formData.partnerPreferences // keep as-is — free text
  // about & partnerPreferences kept as-is (free text paragraphs)
};
      
 setFormData(normalizedFormData);
      const res = await updateUserRecords(normalizedFormData);
      if (res.data.status === "Success") {
       

        const ress = await updateUserRegistrationDetails(normalizedFormData);
        if (ress.data.status === "Success") {

          console.log("user Data updated successfully!");
          // event.target.reset();
        } else if (ress.data.status === "Fail") {
          console.log("Data update unsuccessful.");
        }
        //end user ingest
        console.log("user details Data updated successfully!");
        // event.target.reset();
      } else if (res.data.status === "Fail") {
        console.log("Data update unsuccessful.");

        // ❌ Failure
        showToast({
          title: 'Update Failed',
          description: 'Could not save your profile. Please try again.',
          type: 'error'
        });
      }
    }
    catch (error) {
      if (axios.isCancel(error)) {
        console.log("Failure", error.message)
      } else {
      }
    }
    const validationErrors = {};
    
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
     
      showToast({
        title: 'Profile Updated',
        description: 'Your profile details have been saved successfully.',
        type: 'success'
      });
    }
  };
  return (
    <>  <ThemeProvider theme={theme}>

      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Edit Personal Details</h3>
        </div>
      </div>
      {/* <!--Inner Heading End--> 
  
  <!--Inner Content Start--> */}
      <div className="inner-content">

        <div className="container">
          <div className="profile-Wrap">
            <div className="row">

              <Sidebar></Sidebar>
              <div className="col-lg-8 col-md-8 ep-main"><form className="ep-form" onSubmit={handleSubmit}>
                <div className="ep-body">
                  {/* <!-- General Information --> */}
                  <div className="ep-card ep-card--profile edit-info">
                    <div className="ep-card__head ep-card__head--profile">
                      <div className="avater-box ep-avatar">
                        <div className="ep-avatar__frame">
                          <i className="fas fa-user ep-avatar__placeholder" aria-hidden="true"></i>
                          {getGallery.length > 0 ? (
                            (() => {
                              const profileFile = approvedProfileImage(getGallery);
                              return profileFile ? (
                                <img
                                  // src={profileFile.imagepath}
                                  src={imageUrl(profileFile.imagepath_thumb) || imageUrl(profileFile.imagepath)}
                                  className="img-responsive img-circle edit-avater ep-avatar__img"
                                  alt="Profile"
                                  onError={e => { e.target.src = Profiles.notfound; }}
                                />
                              ) : null;
                            })()
                          ) : null}
                        </div>

                        {/* <img src={Profiles.authorimg} className="img-responsive img-circle edit-avater" alt="" /> */}
                        <div className="upload-btn-wrapper ep-avatar__action">
                          <Link to="/addgallery">
                            <button className="btn theme-btn ep-avatar__btn">Change Avatar</button>
                          </Link>
                          {/* <button className="btn theme-btn">Change Avatar</button> */}
                          {/* <li><Link to="/addgallery"><i className="fas fa-images"></i> Gallery </Link></li> */}
                          {/* <input type="file" name="myfile" /> */}
                        </div>
                      </div>
                      <h3>Personal Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field"> {/* Container Box for consistent size */}

                        <TextField label="First Name" name="fname"
                          value={formData.fname}
                          onChange={handleChange}
                          variant="outlined"
                          InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon />
                            </InputAdornment>),
                          }} margin="normal" fullWidth />
                        {errors.fname && <span className="error">{errors.fname}</span>}
                      </div>
                      <div className="ep-field">

                        <TextField label="Last Name" name="lname" value={formData.lname} onChange={handleChange} variant="outlined" InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon /> </InputAdornment>), }} margin="normal" fullWidth /> {errors.lname && <span className="error">{errors.lname}</span>}
                      </div>
                      <div className="ep-field">
                        {/* <label>Gender</label> <input type="text" className="form-control" value="Daniel Deve" /> */}
                        <TextField label="Gender" name="gender" value={formData.gender}
                          onChange={handleGenderChange} variant="outlined"
                          InputProps={{ readOnly: true, startAdornment: (<InputAdornment position="start"> <PersonIcon /> </InputAdornment>), }} margin="normal" fullWidth />

                        {errors.gender && <span className="error">{errors.gender}</span>}
                      </div>
                      <div className="ep-field">

                        <Autocomplete
                          options={cities}
                          getOptionLabel={(option) => option}
                          value={formData.pob}
                          onChange={handlePobChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Place of birth"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                        {errors.pob && <span className="error">{errors.pob}</span>}
                      </div>
                      <div className="ep-field">

                        {/* <label>DOB</label> <input type="text" name="" data-datedropper placeholder="Date of Birth" className="datedropper form-control" /> */}
                        <TextField name="dob"
                          label="Date of Birth"
                          variant="outlined"
                          type="text"
                          value={formData.dob} InputProps={{
                            readOnly: true

                          }}
                          margin="normal" fullWidth
                        />

                      </div>
                      <div className="ep-field">
                        {/* <label>TOB</label><input type="text" name="" data-datedropper placeholder="Time of Birth" className="datedropper form-control" /> */}
                        <TextField
                          name="tob"
                          value={formData.tob}
                          onChange={handleChange}
                          label="Time of Birth"
                          variant="outlined"
                          type="time"
                          InputProps={{// icon
                            readOnly: true,
                          }}
                          margin="normal" fullWidth
                        />
                      </div>

                      <div className="ep-field">
                        {/* <label>Caste</label><input type="text" className="form-control" value="" /> */}

                        <Autocomplete name="caste"
                          options={castes}
                          getOptionLabel={(option) => option}
                          value={formData.caste}
                          onChange={handleCasteChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Caste"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />

                        {errors.caste && <span className="error">{errors.caste}</span>}
                      </div>
                      <div className="ep-field">
                        <Autocomplete
                          options={MaritalStatus}
                          value={formData.maritalStatus}
                          onChange={handleMaritalStatusChange}
                          getOptionLabel={(option) => option}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Martial Status"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />

                        {errors.maritalStatus && <span className="error">{errors.maritalStatus}</span>}
                      </div>
                      <div className="ep-field">
                        {/* <label>Height</label> */}
                        <Autocomplete
                          options={heights}
                          getOptionLabel={(option) => option}
                          value={formData.height}
                          onChange={handleHeightChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Height"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>

                      <div className="ep-field">
                        {/* <label>Country of Residence</label> <input type="text" className="form-control" value="91 258 587 4123" /> */}
                        <Autocomplete
                          options={countries}
                          getOptionLabel={(option) => option}
                          value={formData.country}
                          onChange={handleCountryChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Countries"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>State</label><input type="text" className="form-control" value="91 258 587 4123" /> */}
                        <Autocomplete
                          options={states}
                          getOptionLabel={(option) => option}
                          value={formData.state}
                          onChange={handleStateChange}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select State"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>City</label><input type="text" className="form-control" value="" /> */}

                        <Autocomplete
                          options={cities}
                          getOptionLabel={(option) => option}
                          value={formData.city}
                          onChange={handleCityChange}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Cities"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                      <div className="ep-field ep-field--full">
                        {/* <label>About Yourself</label><textarea className="form-control" placeholder="Introduction"></textarea> */}
                        <TextField label="About yourself" name="about"
                          value={formData.about}
                          onChange={handleChange}
                          variant="outlined"
                          margin="normal" multiline rows={4} fullWidth />

                      </div>

                    </div>
                  </div>
                  {/* <!-- End General Information --> 
              
              <!-- Edit Location --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-star-and-crescent"></i>
                      <h3>Horoscope Details</h3>
                      <p>Ensure compatibility in marriage through detailed astrological analysis of birth charts.</p>
                    </div>

                    <div className="ep-grid">
                      <div className="ep-field">
                        {/* <label>Nakshtra</label><input type="text" className="form-control" value="Ardra" /> */}
                        <Autocomplete
                          options={nakshtras}
                          getOptionLabel={(option) => option}
                          value={formData.nakshtra}
                          onChange={handleNakshtraChange}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Nakshtras"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Padam</label><input type="text" className="form-control" value="3" /> */}
                        <Autocomplete
                          options={padams}
                          getOptionLabel={(option) => option}
                          value={formData.padam}
                          onChange={handlePadamChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Padam"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Rasi</label><input type="text" className="form-control" value="Midhuna" /> */}
                        <Autocomplete
                          options={rasi}
                          getOptionLabel={(option) => option}
                          value={formData.rasi}
                          onChange={handleRasiChange}

                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Rasi"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                    </div>

                  </div>
                  {/* <!-- End Edit Location --> 
              
              <!-- contact info --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-address-book"></i>
                      <h3>Contact Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        {/* <label>Email</label> <input type="email" className="form-control" value="" placeholder="" /> */}
                        <TextField label="Email" name="email"
                          value={formData.email}
                          onChange={handleChange}
                          variant="outlined" InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start">
                              <EmailIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mobile Number</label><input type="text" className="form-control" value="" placeholder="9xxxxxxxx" /> */}
                        <TextField label="Mobile" name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          variant="outlined" InputProps={{
                            readOnly: true, startAdornment: (<InputAdornment position="start">
                              <PhoneIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              <!-- Qualification And Career --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-graduation-cap"></i>
                      <h3>Educational and Professional Details</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        
                        <Autocomplete
                          options={degree}
                          getOptionLabel={(option) => option}
                          value={formData.degree}
                          onChange={handleDegreeChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Degree/Education Levels"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        <Autocomplete
                          options={professions}
                          getOptionLabel={(option) => option}
                          value={formData.profession}
                          onChange={handleProfessionChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Fields of Study/Professions"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>


                      <div className="ep-field">
                        {/* <label>Job Location</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={jobCities}
                          getOptionLabel={(option) => option}
                          value={formData.jobCity}
                          onChange={handleJobCityChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Job Location"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                        {errors.jobCity && <span className="error">{errors.jobCity}</span>}
                      </div>
                      <div className="ep-field ep-field--salary"> <div className="ep-salary"> <div className="ep-salary__amount">
                        <TextField label="Salary" variant="outlined"
                          InputProps={{
                            readOnly: false, startAdornment: (<InputAdornment position="start">
                              <CurrencyRupeeIcon /> </InputAdornment>),
                          }} margin="normal" fullWidth
                          value={salaryNum} onChange={handleSalaryNumChange}
                        /> </div> <div className="ep-salary__unit"> {/* INR Autocomplete */} <Autocomplete options={inrOptions} getOptionLabel={(option) => option.label}
                          value={salaryUnits} onChange={handleSalaryUnitsChange}
                          renderInput={(params) => (<TextField {...params} label="INR per annum" variant="outlined" margin="normal" />)} /> </div>
                      </div>
                        <Typography variant="body1" component="div" gutterBottom sx={{ color: 'green' }} className="ep-salary__msg"> {salaryMessage} </Typography>
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Qualification And Career --> 
              
              <!-- Physical Info --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-people-roof"></i>
                      <h3> Family Background</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        <TextField name="fatherName" label="Father Name" value={formData.fatherName} onChange={handleChange} variant="outlined" margin="normal" fullWidth
                        />

                      </div>
                      <div className="ep-field">
                        {/* <label>Father Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          value={formData.fatherOccupation}
                          onChange={handleFatherOccupationChange}
                          options={professions}
                          getOptionLabel={(option) => option}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Father Occupation"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mother Name</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="motherName" label="Mother Name" value={formData.motherName} onChange={handleChange} variant="outlined" margin="normal" fullWidth // Ensures the TextField takes full width of the Box 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Mother Occupation</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete value={formData.motherOccupation}
                          onChange={handleMotherOccupationChange}
                          options={professions}
                          getOptionLabel={(option) => option}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Mother Ocupation"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Brothers</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="brothers" label="Brothers" value={formData.brothers} onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={maleSiblings}
                        // onChange={handleMaleSiblingsChange}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Married Brothers</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="brothersMarried" label="No. of Brothers Married"
                          value={formData.brothersMarried}
                          onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={maleSiblingsMarried}
                        // onChange={handleMaleSiblingsMarried} 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Sisters</label>  <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="sisters" label="Sisters" value={formData.sisters} onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={femaleSiblings}
                        // onChange={handleFemaleSiblingsChange} 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Married Sisters</label><input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <TextField name="sistersMarried" label="No. of Sisters Married"
                          value={formData.sistersMarried}
                          onChange={handleChange} variant="outlined"
                          margin="normal" fullWidth
                        // value={femaleSiblingsMarried}
                        // onChange={handleFemaleSiblingsMarried} 
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Current Family Residence</label> <input type="text" className="form-control" value="" placeholder="e.g. Web Designer" /> */}
                        <Autocomplete
                          options={cities}
                          value={formData.familyResidence}
                          onChange={handleFamilyResidenceChange}
                          getOptionLabel={(option) => option}
                          // value={heightValue}
                          // onChange={(event, newValue) => setHeightValue(newValue)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Current Family Residence"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Physical Info --> 
              
              <!-- Hobbies --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-leaf"></i>
                      <h3>Lifestyle Information</h3>
                    </div>
                    <div className="ep-grid">
                      <div className="ep-field">
                        <Autocomplete
                          value={formData.diet} onChange={handleDietChange}
                          options={diet}
                          getOptionLabel={(option) => option}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Select Diet"
                              variant="outlined"
                              margin="normal"
                            />
                          )} fullWidth
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Smoking Habits</label> <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          value={formData.habitsmoke} onChange={handleSmokeHabitsChange}
                          options={habitsOptions}
                          getOptionLabel={(option) => option}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Smoking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                      <div className="ep-field">
                        {/* <label>Drinking Habits</label>  <input type="text" className="form-control" value="" placeholder="" /> */}
                        <Autocomplete
                          value={formData.habitdrink} onChange={handleDrinkHabitsChange}
                          options={habitsOptions}
                          getOptionLabel={(option) => option}
                          // value={genderValue}
                          // onChange={handleGenderChange}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Drinking Habit"
                              variant="outlined"
                              margin="normal"
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Hobbies --> 
              
              <!-- Social Background --> */}
                  <div className="ep-card">
                    <div className="ep-card__head"><i className="fas fa-heart"></i>
                      <h3>Preferences for Partner</h3>
                    </div>
                    <div className="ep-grid">
                      {/* <div className="ep-field">
                        <label>Preferred Age Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="ep-field">
                        <label>Preferred Height Range</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div>
                      <div className="ep-field">
                        <label>Preferred Education Level</label>
                        <input type="text" className="form-control" value="" placeholder="" />
                      </div> */}
                      <div className="ep-field ep-field--full">
                        {/* <label>Other Preferences (Specific qualities or hobbies desired in a partner)</label> */}
                        {/* <textarea className="form-control"></textarea> */}
                        <TextField name="partnerPreferences"
                          value={formData.partnerPreferences} onChange={handleChange}
                          label="Other Preferences (Specific qualities or hobbies desired in a partner)"
                          variant="outlined"
                          multiline
                          rows={4}
                          margin="normal"
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                  {/* <!-- End Social Background --> 
              
              <!-- Life Style --> */}

                  {/* <!-- End Life Style --> 
              
              <!-- Full Information --> */}

                  <div className="ep-savebar">
                    <button className="sub ep-savebar__btn" title="Update Profile">Update Profile</button>

                  </div>
                </div>
              </form>    </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
    </>
  )
}

export default EditProfile