//for lg,sm, md images

import React, { useEffect, useState } from "react";
import Profiles from '../../templates/ImagesLoader'
import Sidebar from './templates/Sidebar'
import { imageUrl } from '../../../utils/imageUrl';
import '../../../assets/css/pages/add-gallery.css';

import { PhotoProvider, PhotoView } from 'react-photo-view';
import {
  fetchUserGallery,
  uploadUserGallery,
  updateProfileStatus,
  deleteGalleryRecord  // ✅ Import the delete function
} from '../../../services/userService';

const AddGallery = () => {
  const [files, setFiles] = useState([]);
  const [fileDetails, setFileDetails] = useState([]);
  const [getGallery, setGetGallery] = useState([]);
  const [imgcount, setimgcount] = useState(0)
  const [trigger, setTrigger] = useState(false)
  const [settingProfileId, setSettingProfileId] = useState(null) // which photo is being set as profile

  const loggedInUserId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetchUserGallery(loggedInUserId);
        setGetGallery(res.data);
        setimgcount((res.data).length);
      }
      catch (error) {
        console.error('Error fetching user gallery:', error);
      }
    };
    fetchUserData();
  }, [loggedInUserId, trigger]);

  const maxFiles = 3;

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const dbfilescount  = imgcount;

    if (dbfilescount + selectedFiles.length > maxFiles) {
      alert(`Limit ${maxFiles} reached. ${maxFiles - dbfilescount} files can upload.`);
      return;
    }

    // ── Convert to base64 only — Sharp on backend handles all resizing ────────
    const base64Files = await Promise.all(
      selectedFiles.map((file) => convertBase64(file))
    );

    setFiles(base64Files);
    setFileDetails(selectedFiles.map((file, index) => ({
      name:    file.name,
      size:    (file.size / 1024).toFixed(2) + ' KB',
      preview: base64Files[index]
    })));
  };

  // ── Convert file to base64 string ─────────────────────────────────────────
  const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload  = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0) return;

    const dbfilescount = imgcount;
    if (dbfilescount >= maxFiles) {
      alert(`Limit ${maxFiles} reached.`);
      return;
    }

    const gallery = files.map((file) => ({
      imagepath:   file,   // base64 — Sharp on backend creates original/medium/thumb
      isprofile:   false,
      userid:      loggedInUserId,
      updateddate: new Date().toISOString().split('T')[0],
    }));

    // ── Send as JSON — backend Sharp processes into 3 sizes ───────────────────
    try {
      const response = await uploadUserGallery({ gallery: JSON.stringify(gallery) });
      console.log("Files uploaded successfully:", response.data);
      setTrigger(!trigger);  // Refresh gallery
      setFiles([]);          // Clear pending files
      setFileDetails([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Upload failed. Please try again.");
    }
  };

  // ✅ Delete from pending uploads (before server upload)
  const handleDeletePending = (index, event) => {
    event.preventDefault();
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedFileDetails = fileDetails.filter((_, i) => i !== index);
    setFiles(updatedFiles);
    setFileDetails(updatedFileDetails);
  };

  // ✅ NEW: Delete from database (existing gallery images)
  const handleDeleteGalleryImage = async (galleryRecordId, event) => {
    if (event) event.preventDefault();

    // 🔐 Confirm before delete
    if (!window.confirm("Are you sure you want to delete this photo? This action cannot be undone.")) {
      return;
    }

    try {
      // ✅ Call userService with BOTH gallery ID and user ID
      const response = await deleteGalleryRecord(galleryRecordId, Number(loggedInUserId));

      console.log("[DELETE] response:", response.data);

      if (response.data.status === "Success") {
        // ✨ Remove deleted image from UI instantly
        setGetGallery(prev => prev.filter(img => img.id !== galleryRecordId));
        setimgcount(prev => prev - 1);
        alert("Photo deleted successfully!");
      } else {
        alert(response.data.result || "Failed to delete photo.");
      }
    } catch (error) {
      console.error("[DELETE] error:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const makeProfile = async (imgid) => {
    setSettingProfileId(imgid); // show loader on the clicked photo's button
    try {
      await updateProfileStatus(imgid);
      setTrigger(!trigger);  // Refresh gallery to show updated profile status
    }
    catch(error) {
      console.error("Error updating profile status:", error);
      alert("Failed to set profile picture.");
    }
    finally {
      setSettingProfileId(null); // hide loader regardless of outcome
    }
  }

  return (
    <>
      <div className="inner-heading" style={{ backgroundImage: `url(${Profiles.titlebg})` }}>
        <div className="container">
          <h3>Gallery & Profile Settings
             {/* {imgcount}/3 Images */}

          </h3>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="profile-Wrap">
            <div className="row">
              <Sidebar trigger={trigger}></Sidebar>

              <div className="col-lg-8 col-md-8 ag-main">
                <div className="ag-body">
                  <div className="ag-card">

                    {/* Header */}
                    <div className="ag-card__head">
                      <i className="fas fa-images"></i>
                      <h3>Manage Photos & Profile Pictures</h3>
                      <p>You can upload max {maxFiles} images. <a href="#">Upgrade</a> for more.</p>
                    </div>

                    {/* Upload Form */}
                    <form className="ag-upload" onSubmit={handleUpload}>
                      <div className="ag-dropzone">
                        <i className="fas fa-cloud-arrow-up ag-dropzone__icon" aria-hidden="true"></i>
                        <input className="ag-dropzone__input" type="file" multiple onChange={handleFileChange} accept="image/*" />

                        {/* Pending Files Preview */}
                        {fileDetails.length > 0 && (
                          <div className="ag-pending">
                            <h4>Selected Files:</h4>
                            <div className="ag-pending__list">
                              {fileDetails.map((file, index) => (
                                <div key={index} className="ag-pending__item">
                                  <div className="ag-pending__name">{file.name}</div>
                                  <div className="ag-pending__thumb">
                                    <img
                                      src={file.preview}
                                      alt={`Preview ${index}`}
                                    />
                                    {/* Delete Pending File Button */}
                                    <button
                                      type="button"
                                      className="ag-icon-btn"
                                      onClick={(event) => handleDeletePending(index, event)}
                                      title="Remove from upload"
                                      aria-label="Remove from upload"
                                    >
                                      <i className="fas fa-times"></i>
                                    </button>
                                  </div>
                                  <div className="ag-pending__size">{file.size}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ag-actions">
                        <button type="submit" className="sub ag-upload__btn" disabled={files.length === 0}>
                          Upload {files.length > 0 && `(${files.length})`}
                        </button>
                      </div>
                    </form>

                    <hr className="ag-divider"/>

                    {/* Existing Gallery Images */}
                    <div className="ag-section-head">
                      <h3>SET AS PROFILE PICTURE</h3>
                      <p className="ag-hint">Click "Set as Profile" to change your main profile picture</p>
                    </div>

                    <div className="ag-grid">
                      <PhotoProvider>
                        {getGallery.length > 0 ? (
                          getGallery.map((file) => (
                            <div
                              key={file.id}  // ✅ Use file.id (gallery record ID)
                              className={`ag-tile${file.isprofile ? ' ag-tile--profile' : ''}`}
                            >
                              {/* Profile + approval badges (stacked, top-left) */}
                              <div className="ag-tile__badges">
                                {file.isprofile && (
                                  <span className="ag-badge ag-badge--profile">
                                    <i className="fas fa-star"></i> Profile
                                  </span>
                                )}

                                {/* Approval status badge — shown on the owner's own
                                    management page so they know a photo is not yet
                                    public. Approved photos get no extra badge. */}
                                {file.status && file.status !== 'approved' && (
                                  <span className={`ag-badge ${file.status === 'rejected' ? 'ag-badge--rejected' : 'ag-badge--pending'}`}>
                                    <i className={file.status === 'rejected' ? 'fas fa-times-circle' : 'fas fa-clock'}></i>{' '}
                                    {file.status === 'rejected' ? 'Rejected' : 'Pending approval'}
                                  </span>
                                )}
                              </div>

                              {/* ✅ Delete Button for Existing Images */}
                              {!file.isprofile && (
                                <button
                                  type="button"
                                  className="ag-icon-btn ag-tile__delete"
                                  onClick={(e) => handleDeleteGalleryImage(file.id, e)}  // ✅ file.id = gallery record ID
                                  title="Delete this photo"
                                  aria-label="Delete this photo"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}

                              {/* Image */}
                              {/* ── ✅ FIXED: Medium for BOTH lightbox and card display ── */}
                              <div className="ag-tile__media">
                                <PhotoView src={imageUrl(file.imagepath_medium) || imageUrl(file.imagepath)}>
                                  <img
                                    className="ag-tile__img"
                                    src={imageUrl(file.imagepath_medium) || imageUrl(file.imagepath)}
                                    alt={`Gallery ${file.id}`}
                                  />
                                </PhotoView>
                              </div>

                              {/* Action Buttons */}
                              <div className="ag-tile__actions">
                                {/* Set as Profile Button */}
                                <button
                                  type="button"
                                  className={`ag-btn ${file.isprofile ? 'ag-btn--success' : 'ag-btn--primary'}`}
                                  onClick={() => makeProfile(file.id)}
                                  disabled={file.isprofile || settingProfileId === file.id}
                                >
                                  {settingProfileId === file.id ? (
                                    <>
                                      <i className="fas fa-spinner fa-spin"></i>
                                      Updating...
                                    </>
                                  ) : (
                                    file.isprofile ? "✓ Current" : "Set Profile"
                                  )}
                                </button>

                                {/* Delete Button (Mobile-friendly text version) */}
                                {!file.isprofile && (
                                  <button
                                    type="button"
                                    className="ag-btn ag-btn--danger"
                                    onClick={(e) => handleDeleteGalleryImage(file.id, e)}
                                  >
                                    <i className="fas fa-trash"></i> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="ag-empty">
                            <i className="fas fa-images ag-empty__icon"></i>
                            <p>No gallery images yet.</p>
                            <p className="ag-empty__sub">Upload photos to get started!</p>
                          </div>
                        )}
                      </PhotoProvider>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AddGallery;
