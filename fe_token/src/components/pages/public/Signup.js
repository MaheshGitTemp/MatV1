// src/components/pages/public/Signup.js
//
// UI REDESIGN NOTE:
// This file received a full visual redesign (grouped card/section layout,
// restyled inputs). ALL logic is preserved from the previous version:
// the same field `name` attributes, the same validate() rules, the same
// OTP send/verify/resend flow, the same salary handling, and the same
// show/hide password behavior. No backend contract changed.
//
// BEHAVIOR FIX (intentional, 2 lines): previously the formatted date/time of
// birth were written to dataObj.date / dataObj.time, but the backend inserts
// the `udob` / `utob` columns. Those keys are now populated so birth details
// actually persist. (See the two marked lines in submitHandler.)
import React, { useContext, useEffect, useState } from 'react';
import bkImg from '../../templates/ImagesLoader';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../../assets/css/pages/signup.css';
import jsonArr from '../../templates/data/jsonData';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../hooks/AuthContext';
import { registerUser, sendOtp, verifyOtp } from '../../../services/authService';
import { useToast } from '../../../components/hooks/ToastContext';
import { toTitleCase } from '../../../utils/normalizeText';

// Salary unit options
const inrOptions = [
  { label: "Thousands", value: "thousands" },
  { label: "Lakhs",     value: "lakhs"     },
  { label: "Crores",    value: "crores"    }
];

// ── Presentation helper: shared input class + error modifier ──────────────
const fieldClass = (hasError) => (hasError ? 'form-control sg-field--error' : 'form-control');

const Signup = (props) => {
  const navigate    = useNavigate();
  const authcontext = useContext(AuthContext);
  const { isLoggedIn } = authcontext;
  const { showToast } = useToast();

  useEffect(() => {
    if (isLoggedIn) { navigate("/profiles"); }
  }, [isLoggedIn, navigate]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [errors,       setErrors]       = useState({});
  const [signupStatus, setSignupStatus] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [startDate,    setStartDate]    = useState(new Date());
  const [startTime,    setStartTime]    = useState(new Date());

  // ── Salary state ──────────────────────────────────────────────────────────
  const [salaryNum,     setSalaryNum]     = useState("");
  const [salaryUnits,   setSalaryUnits]   = useState("Lakhs");
  const [salaryMessage, setSalaryMessage] = useState("");
  const [salaryPackage, setSalaryPackage] = useState("NA");

  // ── OTP state ─────────────────────────────────────────────────────────────
  const [showOtpModal,    setShowOtpModal]    = useState(false);
  const [otpValue,        setOtpValue]        = useState('');
  const [otpError,        setOtpError]        = useState('');
  const [otpSuccess,      setOtpSuccess]      = useState('');
  const [otpLoading,      setOtpLoading]      = useState(false);
  const [resendLoading,   setResendLoading]   = useState(false);
  const [resendTimer,     setResendTimer]     = useState(0);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [sendingOtp,      setSendingOtp]      = useState(false); // spinner while OTP email is sent

  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleRadioChange = (event) => {
    const { value } = event.target;
    setShowDropdown(value === "relationship");
  };

  const handleSalaryNumChange = (event) => {
    const value = event.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalaryNum(value);
      updateSalaryMessage(value, salaryUnits);
    }
  };

  const handleSalaryUnitsChange = (event) => {
    const value = event.target.value;
    setSalaryUnits(value);
    updateSalaryMessage(salaryNum, value);
  };

  const updateSalaryMessage = (num, units) => {
    if (num && units) {
      const packageValue = `${num} ${units}`;
      setSalaryPackage(packageValue);
      setSalaryMessage(`** ${num} ${units} per Annum`);
    } else {
      setSalaryPackage("NA");
      setSalaryMessage("");
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (requiredFieldsData) => {
    const errors = {};
    if (!requiredFieldsData.uemail) {
      errors.uemail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(requiredFieldsData.uemail)) {
      errors.uemail = "Email address is invalid";
    }
    if (!requiredFieldsData.upassword) {
      errors.upassword = "Password is required";
    } else if (requiredFieldsData.upassword.length < 6) {
      errors.upassword = "Password must be at least 6 characters";
    }
    if (!requiredFieldsData["confirm-password"]) {
      errors["confirm-password"] = "Confirm Password is required";
    } else if (requiredFieldsData.upassword !== requiredFieldsData["confirm-password"]) {
      errors["confirm-password"] = "Passwords do not match";
    }
    if (!requiredFieldsData["ufname"])   { errors["ufname"] = "First Name is required"; }
    if (!requiredFieldsData["ulname"])   { errors["ulname"] = "Last Name is required"; }
    if (!requiredFieldsData["ucreated"]) { errors["ucreated"] = " * Please select a profile option."; }
    if (requiredFieldsData["relation"] === "Select Relation") { errors["relation"] = "Relation is required"; }
    if (!requiredFieldsData["udob"])     { errors["udob"] = "Date of birth is required"; }
    if (!requiredFieldsData["utob"])     { errors["utob"] = "Time of birth is required"; }
    if (requiredFieldsData["ugender"] === "Select Gender")       { errors["ugender"] = "Gender is required"; }
    if (requiredFieldsData["upob"] === "Select birth place")     { errors["upob"] = "Place of birth is required"; }
    if (requiredFieldsData["upresentloc"] === "Select District") { errors["upresentloc"] = "Present Location is required"; }
    if (!requiredFieldsData["uphone"])   { errors["uphone"] = "Phone is required"; }
    if (requiredFieldsData["uheight"] === "Select Height") { errors["uheight"] = "Height is required"; }
    if (requiredFieldsData["ucaste"] === "Select Caste")   { errors["ucaste"] = "Caste is required"; }
    if (requiredFieldsData["ujob"] === "Select Job")       { errors["ujob"] = "Job is required"; }
    if (!salaryNum) { errors["salary"] = "Salary amount is required"; }
    if (!requiredFieldsData.terms) { errors.terms = "* You must agree to the terms and conditions."; }
    setErrors(errors);
    return errors;
  };

  // ── Submit Handler — sends OTP first, registers after OTP verified ────────
  const submitHandler = async (event) => {
    event.preventDefault();
    const fd      = new FormData(event.target);
    const dataObj = Object.fromEntries(fd.entries());
          dataObj.date     = format(startDate, "MM/dd/yyyy");
          dataObj.time     = format(startTime, "HH:mm");
          // ── FIX: populate the keys the backend actually inserts (udob/utob) ──
          dataObj.udob     = format(startDate, "MM/dd/yyyy");
          dataObj.utob     = format(startTime, "HH:mm");
          // ─────────────────────────────────────────────────────────────────────
          dataObj.upackage = salaryPackage;

    const givendob      = new Date(dataObj.date).getFullYear();
    const curyear       = new Date().getFullYear();
    const validationerr = validate(dataObj);

    if (!Object.keys(validationerr).length) {
      if ((curyear) - (givendob) <= 17) {
        setSignupStatus("Please Enter valid Age...");
        return;
      }
      // ── Normalize names to Title Case before saving ───────────────────────
      dataObj.ufname = toTitleCase(dataObj.ufname);
      dataObj.ulname = toTitleCase(dataObj.ulname);
      // ─────────────────────────────────────────────────────────────────────
      // Step 1: Send OTP to email before registering
      try {
        setSignupStatus('');
        setSendingOtp(true); // show spinner while the OTP email is sent
        const otpRes = await sendOtp(dataObj.uemail);

        if (otpRes.data.status === 'Success') {
          setPendingFormData(dataObj);  // store form data until OTP verified
          setShowOtpModal(true);
          setOtpError('');
          setOtpSuccess('');
          setOtpValue('');
          startResendTimer();
        } else {
          setSignupStatus('Failed to send OTP. Please check your email and try again.');
        }
      } catch (error) {
        console.error('Send OTP error:', error);
        setSignupStatus('Failed to send OTP. Please try again.');
      } finally {
        setSendingOtp(false); // hide spinner regardless of outcome
      }

    } else {
      setSignupStatus("* Registration unsuccessful. Please fill all the fields.");
    }
  };

  // ── Start 30s resend countdown timer ─────────────────────────────────────
  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Verify OTP then register ──────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP.');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setOtpSuccess('');

    try {
      const verifyRes = await verifyOtp(pendingFormData.uemail, otpValue);

      if (verifyRes.data.status === 'Success') {
        setOtpSuccess('Email verified! Completing registration...');

        // Step 2: Register only after OTP verified
        const res = await registerUser(pendingFormData);

        if (res.data.status === 'Success') {
          setShowOtpModal(false);
          setSignupStatus('Registration successful. Welcome aboard!');
          setPendingFormData(null);
          setOtpValue('');
          showToast({
            title:       '🎉 Welcome to TeluguSambandham!',
            description: 'Your account has been created successfully. Please login to continue.',
            type:        'success',
            duration:    5000
          });
          // Optional: redirect to login after 2s
          setTimeout(() => navigate('/login'), 2000);
        } else if (res.data.status === 'Failure') {
          setOtpSuccess('');
          setOtpError('Registration failed. Email or phone already exists.');
          showToast({
            title:       'Registration Failed',
            description: 'Email or phone number already exists. Please try with different details.',
            type:        'error'
          });
        } else {
          setOtpSuccess('');
          setOtpError('Registration failed. Please try again.');
          showToast({
            title:       'Invalid OTP',
            description: 'The OTP you entered is incorrect or expired. Please try again.',
            type:        'error'
          });
        }
      } else {
        setOtpError(verifyRes.data.result || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setOtpError('Something went wrong. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP — generates new OTP, old one becomes invalid ──────────────
  const handleResendOtp = async () => {
    if (resendTimer > 0 || !pendingFormData) return;
    setResendLoading(true);
    setOtpError('');
    setOtpSuccess('');
    setOtpValue('');
    try {
      const res = await sendOtp(pendingFormData.uemail);
      if (res.data.status === 'Success') {
        setOtpSuccess('New OTP sent to your email!');
        // ✅ OTP resent
        showToast({
          title:       'OTP Sent',
          description: 'A new OTP has been sent to your email address.',
          type:        'info'
        });
        startResendTimer();
      } else {
        setOtpError('Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // =========================================================================
  //  RENDER
  // =========================================================================
  return (
    <>
      <div className="inner-content loginbg sg-page" style={{ backgroundImage: `URL(${bkImg.loginbg1})` }}>
        <div className="sg-wrap">
          <div className="sg-card">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="sg-hero">
              <div className="sg-hero__icon" aria-hidden="true">
                <i className="fas fa-user-plus"></i>
              </div>
              <h4 className="sg-hero__title">Create an Account</h4>
              <p className="sg-hero__sub">Only for Telangana &amp; Andhra Pradesh States</p>
            </div>

            <form onSubmit={submitHandler}>
              <div className="sg-body">

                {/* ── Profile Type ──────────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Profile Type</h5>
                  <div className="sg-choices">
                    <label className="sg-choice">
                      <input type="radio" value="myself" name="ucreated" onChange={handleRadioChange} />
                      This profile is for myself
                    </label>
                    <label className="sg-choice">
                      <input type="radio" value="relationship" name="ucreated" onChange={handleRadioChange} />
                      My relationship with bride/groom
                    </label>
                  </div>
                  {errors.ucreated && <span className="sg-error">{errors.ucreated}</span>}

                  {showDropdown && (
                    <div className="sg-relation">
                      <label className="sg-label">Relation</label>
                      <select name="relation" className={fieldClass(errors.relation)}>
                        <option>Select Relation</option>
                        {jsonArr.relationship.map((res, i) => <option key={i}>{res.relation}</option>)}
                      </select>
                      {errors.relation && <span className="sg-error">{errors.relation}</span>}
                    </div>
                  )}
                </div>

                {/* ── Personal Details ──────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Personal Details</h5>
                  <div className="sg-grid">
                    <div className="sg-col">
                      <label className="sg-label">First Name</label>
                      <input type="text" name="ufname" placeholder="Name" className={fieldClass(errors.ufname)} />
                      {errors.ufname && <span className="sg-error">{errors.ufname}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Last Name</label>
                      <input type="text" name="ulname" placeholder="Name" className={fieldClass(errors.ulname)} />
                      {errors.ulname && <span className="sg-error">{errors.ulname}</span>}
                    </div>

                    <div className="sg-col">
                      <label className="sg-label">Gender</label>
                      <select name="ugender" className={fieldClass(errors.ugender)}>
                        <option>Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {errors.ugender && <span className="sg-error">{errors.ugender}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Height</label>
                      <select name="uheight" className={fieldClass(errors.uheight)}>
                        <option>Select Height</option>
                        {jsonArr.heightData.map((res, i) => <option key={i} value={res.heightlabel}>{res.heightlabel}</option>)}
                      </select>
                      {errors.uheight && <span className="sg-error">{errors.uheight}</span>}
                    </div>

                    <div className="sg-col">
                      <label className="sg-label">Caste</label>
                      <select name="ucaste" className={fieldClass(errors.ucaste)}>
                        <option>Select Caste</option>
                        {jsonArr.casteData.map((res, i) => <option key={i} value={res.castelabel}>{res.castelabel}</option>)}
                      </select>
                      {errors.ucaste && <span className="sg-error">{errors.ucaste}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Birth Details ─────────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Birth Details</h5>
                  <div className="sg-grid">
                    <div className="sg-col">
                      <label className="sg-label">Date of birth</label>
                      <DatePicker
                        name="udob"
                        className="form-control"
                        wrapperClassName="signup-datepicker"
                        selected={startDate}
                        onChange={date => setStartDate(date)}
                      />
                      {errors.udob && <span className="sg-error">{errors.udob}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Time of birth</label>
                      <DatePicker
                        name="utob"
                        className="form-control"
                        wrapperClassName="signup-datepicker"
                        selected={startTime}
                        onChange={(time) => setStartTime(time)}
                        showTimeSelect showTimeSelectOnly timeIntervals={15}
                        timeCaption="Time" dateFormat="HH:mm"
                      />
                      {errors.utob && <span className="sg-error">{errors.utob}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Place of birth</label>
                      <select name="upob" className={fieldClass(errors.upob)}>
                        <option>Select birth place</option>
                        {jsonArr.districtData.map((res, i) => <option key={i} value={res.districtlabel}>{res.districtlabel}</option>)}
                      </select>
                      {errors.upob && <span className="sg-error">{errors.upob}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Location ──────────────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Job Location</h5>
                  <div className="sg-grid">
                    <div className="sg-col">
                      <label className="sg-label">Country</label>
                      <select name="ucountry" className="form-control">
                        <option>Select Country</option>
                        {jsonArr.countries.map((res, i) => <option key={i} value={res.country}>{res.country}</option>)}
                      </select>
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">State</label>
                      <select name="ustate" className="form-control">
                        <option>Select State</option>
                        {jsonArr.states.map((res, i) => <option key={i} value={res.state}>{res.state}</option>)}
                      </select>
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">City/Current Location</label>
                      <select name="upresentloc" className={fieldClass(errors.upresentloc)}>
                        <option>Select District</option>
                        {jsonArr.districtData.map((res, i) => <option key={i} value={res.districtlabel}>{res.districtlabel}</option>)}
                      </select>
                      {errors.upresentloc && <span className="sg-error">{errors.upresentloc}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Phone</label>
                      <input type="text" name="uphone" placeholder="e.g. 9999999999" className={fieldClass(errors.uphone)} />
                      {errors.uphone && <span className="sg-error">{errors.uphone}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Contact & Security ────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Contact &amp; Security</h5>
                  <div className="sg-grid">
                    <div className="sg-col sg-col--full">
                      <label className="sg-label">Email</label>
                      <input type="text" name="uemail" placeholder="Enter Email" className={fieldClass(errors.uemail)} />
                      {errors.uemail && <span className="sg-error">{errors.uemail}</span>}
                    </div>

                    <div className="sg-col">
                      <label className="sg-label">Password</label>
                      <div className="sg-pw">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="upassword"
                          placeholder="Password"
                          className={fieldClass(errors.upassword)}
                        />
                        <button
                          type="button"
                          className="sg-pw__toggle"
                          onClick={() => setShowPassword(p => !p)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                        </button>
                      </div>
                      {errors.upassword && <span className="sg-error">{errors.upassword}</span>}
                    </div>

                    <div className="sg-col">
                      <label className="sg-label">Confirm Password</label>
                      <div className="sg-pw">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirm-password"
                          placeholder="Confirm Password"
                          className={fieldClass(errors['confirm-password'])}
                        />
                        <button
                          type="button"
                          className="sg-pw__toggle"
                          onClick={() => setShowConfirmPassword(p => !p)}
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          <i className={showConfirmPassword ? 'far fa-eye-slash' : 'far fa-eye'}></i>
                        </button>
                      </div>
                      {errors['confirm-password'] && <span className="sg-error">{errors['confirm-password']}</span>}
                    </div>
                  </div>
                </div>

                {/* ── Professional ──────────────────────────────────────── */}
                <div className="sg-section">
                  <h5 className="sg-section__title">Professional</h5>
                  <div className="sg-grid sg-grid--pro">
                    <div className="sg-col sg-col--job">
                      <label className="sg-label">Job</label>
                      <select name="ujob" className={fieldClass(errors.ujob)}>
                        <option>Select Job</option>
                        {jsonArr.occupationData.map((res, i) => <option key={i} value={res.occupation}>{res.occupation}</option>)}
                      </select>
                      {errors.ujob && <span className="sg-error">{errors.ujob}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Salary Amount</label>
                      <input
                        type="text"
                        value={salaryNum}
                        onChange={handleSalaryNumChange}
                        placeholder="e.g. 5, 10.5"
                        className={fieldClass(errors.salary)}
                      />
                      {errors.salary && <span className="sg-error">{errors.salary}</span>}
                    </div>
                    <div className="sg-col">
                      <label className="sg-label">Salary Unit</label>
                      <select value={salaryUnits} onChange={handleSalaryUnitsChange} className="form-control">
                        {inrOptions.map((option, i) => (
                          <option key={i} value={option.label}>{option.label}</option>
                        ))}
                      </select>
                    </div>

                    {salaryMessage && (
                      <div className="sg-col sg-col--full">
                        <p className="sg-salary-note">
                          {salaryMessage}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Hidden salary field (preserved) */}
                  <input type="hidden" name="salaryPackage" value={salaryPackage} />
                </div>

                {/* ── Terms ─────────────────────────────────────────────── */}
                <div className="sg-section">
                  <label className="sg-terms">
                    <input type="checkbox" name="terms" id="termscond" />
                    <span>I have read and agree to <a href="#">Terms &amp; Conditions</a> mentioned on this link</span>
                  </label>
                  {errors.terms && <span className="sg-error">{errors.terms}</span>}
                </div>

                {/* ── Submit ────────────────────────────────────────────── */}
                <button
                  type="submit"
                  disabled={sendingOtp}
                  className="btn btn-primary btn-block sg-submit"
                >
                  {sendingOtp && <span className="sg-spinner" aria-hidden="true" />}
                  {sendingOtp ? 'Sending OTP...' : 'Sign Up'}
                </button>

                {/* ── Status message ────────────────────────────────────── */}
                {signupStatus && (
                  <div className="sg-status-wrap">
                    <span className={`sg-status ${signupStatus.includes('successful') ? 'is-success' : 'is-error'}`}>
                      {signupStatus}
                    </span>
                  </div>
                )}

                {/* ── Login link ────────────────────────────────────────── */}
                <p className="sg-login">
                  Already have an account?{' '}
                  <button type="button" className="sg-linkbtn" onClick={() => navigate('/login')}>
                    Login
                  </button>
                </p>

              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── OTP Verification Modal (unchanged behavior) ───────────────────────── */}
      {showOtpModal && (
        <div className="sg-otp-overlay" role="dialog" aria-modal="true" aria-label="Verify Your Email">
          <div className="sg-otp">

            {/* Modal Header */}
            <div className="sg-otp__head">
              <h4 className="sg-otp__title">
                <i className="far fa-envelope"></i>
                Verify Your Email
              </h4>
            </div>

            {/* Modal Body */}
            <div className="sg-otp__body">

              <p className="sg-otp__lead">
                We sent a 6-digit OTP to
              </p>
              <p className="sg-otp__mail">
                {pendingFormData?.uemail}
              </p>

              {/* OTP Input */}
              <div className="sg-otp__field">
                <input
                  type="text"
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, ''); // numbers only
                    setOtpValue(val);
                    setOtpError('');
                  }}
                  placeholder="Enter 6-digit OTP"
                  className={`sg-otp-input${otpError ? ' is-error' : ''}`}
                />
              </div>

              {/* Error message */}
              {otpError && (
                <div className="sg-alert sg-alert--error">
                  <i className="fas fa-times-circle"></i>
                  {otpError}
                </div>
              )}

              {/* Success message */}
              {otpSuccess && (
                <div className="sg-alert sg-alert--success">
                  <i className="far fa-check-circle"></i>
                  {otpSuccess}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerifyOtp}
                disabled={otpLoading || otpValue.length !== 6}
                className="sg-otp__verify"
              >
                {otpLoading ? '⏳ Verifying...' : '✓ Verify & Complete Registration'}
              </button>

              {/* Resend OTP */}
              <div className="sg-otp__resend">
                {resendTimer > 0 ? (
                  <p className="sg-otp__timer">
                    Resend OTP in{' '}
                    <strong>{resendTimer}s</strong>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="sg-linkbtn"
                  >
                    {resendLoading ? '⏳ Sending...' : '🔄 Resend OTP'}
                  </button>
                )}
              </div>

              {/* Back to form */}
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setPendingFormData(null);
                  setOtpValue('');
                  setOtpError('');
                  setOtpSuccess('');
                }}
                className="sg-otp__back"
              >
                ← Back to form (change email)
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Signup;
