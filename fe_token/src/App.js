import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import './App.css';
import { AuthContext, AuthProvider } from './components/hooks/AuthContext';
import { ToastProvider } from './components/hooks/ToastContext';  // ← ADD
import Listing from './components/pages/public/Listing';
import ProfileDetails from './components/pages/public/ProfileDetails';
import SignIn from './components/pages/public/SignIn';
import Signup from './components/pages/public/Signup';
import Footer from './components/templates/Footer';
import Header from './components/templates/Header';
import BottomNav from './components/templates/BottomNav';
import AdvanceSearch from "./components/pages/public/AdvanceSearch";
import Dashboard from "./components/pages/private/Dashboard";
import EditProfile from "./components/pages/private/EditProfile";
import ChangePassword from "./components/pages/private/ChangePassword";
import AddGallery from "./components/pages/private/AddGallery";
import ProfileSecurity from "./components/pages/private/ProfileSecurity";
import Messages from "./components/pages/private/Messages";
import ProtectedRoute from "./components/hooks/ProtectedRoute";
import CloseAccount from "./components/pages/private/CloseAccount";
 import ForgotPassword from "./components/pages/public/ForgotPassword";
   import Home from './components/pages/public/Home';
// Admin panel — separate shell (own routes, own axios, no public Header/Footer)
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminPhotos from "./components/admin/AdminPhotos";
import AdminMessagesList from "./components/admin/AdminMessagesList";
import Impersonate from "./components/admin/Impersonate";

function App() {
  const authcontext=useContext(AuthContext)
  return (<>
    <AuthProvider> 
        <ToastProvider> 
    <Router>
        <Routes> 
          <Route path="/" element={<> <Header/> <Home/> <Footer/> </>} />
          <Route path="/signup" element={<><Header/><Signup /><Footer/></>} />
          <Route path="/login"  element={<><Header/><SignIn /><Footer/></>} />
          <Route path="/profiles" element={<ProtectedRoute>
            <Header/><Listing /><Footer/>
              </ProtectedRoute> } />
          <Route path="/profiledetails/:uid" element={<><Header/><ProfileDetails /><Footer/></>} />
          <Route path="/advancesearch" element={<> <ProtectedRoute>  <Header/> <AdvanceSearch />  <Footer/>  </ProtectedRoute> </>} />
          <Route path="/dashboard" element={<ProtectedRoute>  <Header/><Dashboard /><Footer/>  </ProtectedRoute> } />
          <Route path="/editprofile" element={<><ProtectedRoute>  <Header/> <EditProfile /> <Footer/>  </ProtectedRoute> </>} />
          <Route path="/changepassword" element={<><ProtectedRoute>  <Header/> <ChangePassword /> <Footer/>  </ProtectedRoute> </>} />
          <Route path="/closeaccount" element={
  <ProtectedRoute><Header/><CloseAccount /><Footer/></ProtectedRoute>
} />
          <Route path="/addgallery" element={<><Header/><AddGallery /><Footer/></>} />
          <Route path="/profilesecurity" element={<><Header/><ProfileSecurity /><Footer/></>} />
          <Route path="/messages" element={<><Header/><Messages /><Footer/></>} /> 

<Route path="/forgotpassword" element={<><Header/><ForgotPassword /><Footer/></>} />

          {/* Admin — separate shell, no public Header/Footer */}
          <Route path="/adminhub/matrimony/login" element={<AdminLogin />} />
          <Route path="/adminhub/matrimony" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route path="dashboard"    element={<AdminDashboard />} />
            <Route path="users"        element={<AdminUsers />} />
            <Route path="photos"       element={<AdminPhotos />} />
            <Route path="messageslist" element={<AdminMessagesList />} />
          </Route>

          {/* Public impersonation handler — mints user session from a one-time token */}
          <Route path="/impersonate" element={<Impersonate />} />
          </Routes>
        {/* Mobile-only fixed bottom navigation (hidden on desktop + admin) */}
        <BottomNav />
    </Router>
   </ToastProvider>  
    </AuthProvider></>
  );
}

export default App;
