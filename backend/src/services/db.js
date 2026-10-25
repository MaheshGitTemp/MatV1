const { convertCredentials, hashPassword } = require('./passwordfunction');
const pool = require('./pool');
var format = require('pg-format');

//Registration

// module.exports.register = async (dataToSave) => {
const register = async (dataToSave) => {
  try {
    let validateData = await ValidateUser(dataToSave); // validateuser() checks if email/mobile already exist in db table
    if (validateData.length > 0) {
      return false;
    } else {
      let encryptedPassword = await hashPassword(dataToSave.upassword);
      dataToSave.upassword = encryptedPassword;
      // await the insert so a DB failure propagates to the caller instead of
      // being silently fire-and-forgotten (which made failed signups look OK).
      await saveObjectsToDatabase(dataToSave);
      return true;
    }
  } catch (e) {
    console.error('register error:', e);
    throw e; // let the controller return a real 500 instead of a false success
  }
}

async function ValidateUser(dataToSave) {
  const client1 = await pool.connect();
  try {
    const query = {
      text: 'select * from users WHERE uemail = $1 OR uphone = $2',
      values: [dataToSave.uemail, dataToSave.uphone],
    };
    const res = await client1.query(query);
    return res.rows;
  } catch (error) {
    console.error('ValidateUser error:', error);
    throw error;
  } finally {
    client1.release();
  }
}

//after validateUser() returns 0 rows then below data inserted in db.
async function saveObjectsToDatabase(obj) {
  const client = await pool.connect();
  try {
    const query = 'INSERT INTO users (relation, ucreated, ufname, ulname, udob, utob, ugender,  upob, upresentloc, uphone, uheight, ucaste, uemail, upassword, ujob, upackage,ucountry,ustate) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,$17,$18)  RETURNING uid  ';
    const values = [obj.relation, obj.ucreated, obj.ufname, obj.ulname, obj.udob, obj.utob, obj.ugender, obj.upob, obj.upresentloc, obj.uphone, obj.uheight, obj.ucaste, obj.uemail, obj.upassword, obj.ujob, obj.upackage, obj.ucountry, obj.ustate];
    const result = await client.query(query, values);
    const newUid = result.rows[0].uid;

    // Insert into userdetails table using the generated uid
    const queryDetails = `
      INSERT INTO userdetails (uid,maritalstatus) VALUES ($1,$2)
    `;
    await client.query(queryDetails, [newUid, "Single"]);
    return newUid;
  } catch (error) {
    console.error('saveObjectsToDatabase error:', error);
    throw error; // propagate so register() fails loudly
  } finally {
    client.release(); // always release, even on error (was leaking on throw)
  }
}
//end of Registration.
// ...existing code...
// ...existing code...
const GetAllUsers = async (page = 1, limit = 20, gender = null) => {
  try {
    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      let genderParam = null;
      if (gender && typeof gender === 'string') {
        const g = gender.trim().toLowerCase();
        if (g === 'male') genderParam = 'Male';
        else if (g === 'female') genderParam = 'Female';
      }

      // ✅ SQL snippet to fetch profile images with privacy check.
      // Only APPROVED images are shown to other users (approval workflow).
      const profileImageSql = `
        (SELECT CASE WHEN a.hide_picture = true THEN NULL ELSE g.imagepath END FROM usergallery g WHERE g.uid = a.uid AND g.isprofile = true AND g.status = 'approved' LIMIT 1) AS profile_image,
        (SELECT CASE WHEN a.hide_picture = true THEN NULL ELSE g.imagepath_thumb END FROM usergallery g WHERE g.uid = a.uid AND g.isprofile = true AND g.status = 'approved' LIMIT 1) AS profile_image_thumb
      `;

      if (genderParam) {
        const dataQuery = {
          text: `SELECT a.*, ${profileImageSql} FROM users a WHERE a.ugender = $1 AND a.profile_status = 'approved' ORDER BY a.uid LIMIT $2 OFFSET $3`,
          values: [genderParam, limit, offset]
        };
        const countQuery = {
          text: "SELECT COUNT(*) AS total FROM users WHERE ugender = $1 AND profile_status = 'approved'",
          values: [genderParam]
        };
        const [dataRes, countRes] = await Promise.all([client.query(dataQuery), client.query(countQuery)]);
        return { rows: dataRes.rows, total: parseInt(countRes.rows[0].total, 10) };
      } else {
        const dataQuery = {
          text: `SELECT a.*, ${profileImageSql} FROM users a WHERE a.profile_status = 'approved' ORDER BY a.uid LIMIT $1 OFFSET $2`,
          values: [limit, offset]
        };
        const countQuery = { text: "SELECT COUNT(*) AS total FROM users WHERE profile_status = 'approved'" };
        const [dataRes, countRes] = await Promise.all([client.query(dataQuery), client.query(countQuery)]);
        return { rows: dataRes.rows, total: parseInt(countRes.rows[0].total, 10) };
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error while getting data:', error);
    throw error;
  }
} 

const GetUserById = async (data) => {
  try {
    const client4 = await pool.connect();
    const query = {
      text: 'select * from users WHERE uid = $1',
      values: [data],
    };
    const res = await client4.query(query);
    // Close the connection
    client4.release(); // Use release() instead of end() to return the client to the pool
    return res.rows;
  } catch (error) {
    console.error('Error while getting data:', error);
  }
}


// Look up a user by ANY login identifier:
//   • email            → matches uemail
//   • mobile number    → matches uphone
//   • Matrimony ID     → "MAT123" or a plain number → matches uid
const GetUserDetails = async (data) => {
  try {
    const client2 = await pool.connect();

    const raw = (data == null ? '' : String(data)).trim();
    // Derive a numeric uid when the input looks like a Matrimony ID (MAT123) or
    // a bare number; null otherwise so the uid branch is skipped safely.
    const matMatch = raw.match(/^MAT\s*0*(\d+)$/i);
    let uidCandidate = null;
    if (matMatch) {
      uidCandidate = parseInt(matMatch[1], 10);
    } else if (/^\d+$/.test(raw) && raw.length <= 9) {
      // short all-digit value → treat as a possible uid (long digit strings are
      // phone numbers and are matched by uphone below).
      uidCandidate = parseInt(raw, 10);
    }

    const query = {
      text: `SELECT * FROM users
               WHERE uemail = $1
                  OR uphone = $1
                  OR ($2::int IS NOT NULL AND uid = $2::int)`,
      values: [raw, Number.isFinite(uidCandidate) ? uidCandidate : null],
    };
    const res = await client2.query(query);
    client2.release(); // return the client to the pool
    return res.rows;
  } catch (error) {
    console.error('Error while getting data:', error);
  }
}


 
const SaveUserGallery = async (list) => {
  try {
    const client = await pool.connect();
    const items = JSON.parse(list);
    
    // ✅ Map all 3 image paths + metadata.
    // New uploads are saved as 'pending' — they stay hidden from other users
    // until an admin approves them. (Existing rows were grandfathered to
    // 'approved' by migration 002.)
    const values = items.map(obj => [
      obj.imagepath, 
      obj.imagepath_medium, 
      obj.imagepath_thumb, 
      obj.isprofile, 
      obj.userid, 
      obj.updateddate,
      'pending',
      true   // watermarked: new uploads are watermarked by imageService at upload
    ]);

    // ✅ Insert all columns (incl. approval status + watermark flag) into the database
    const query = format(
      'INSERT INTO usergallery ("imagepath", "imagepath_medium", "imagepath_thumb", "isprofile", "uid", "updateddate", "status", "watermarked") VALUES %L RETURNING *', 
      values
    );

    const res = await client.query(query);

    client.release(); 
    return res.rows;
  } catch (error) {
    console.error('Error while saving gallery to the database:', error);
    throw error;
  }
}

const DeleteUserGalleryRecord = async (galleryId, userId) => {
  const client = await pool.connect();
  try {
    // 🔐 Step 1: Verify ownership + get image path for file deletion
    const checkQuery = {
      text: 'SELECT id, imagepath, isprofile FROM usergallery WHERE id = $1 AND uid = $2',
      values: [galleryId, userId]
    };
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      return { success: false, message: 'Gallery record not found or unauthorized.' };
    }
    
    const record = checkResult.rows[0];
    
    // 🛡️ Step 2: Block deletion of profile picture
    if (record.isprofile === true) {
      return { 
        success: false, 
        message: 'Cannot delete profile picture. Please set another image as profile first.' 
      };
    }
    
    // 🗑️ Step 3: Delete from database
    const deleteQuery = {
      text: 'DELETE FROM usergallery WHERE id = $1 RETURNING id',
      values: [galleryId]
    };
    const deleteResult = await client.query(deleteQuery);
    
    // 📁 Step 4: Delete physical file (if exists)
    if (record.imagepath) {
      const fs = require('fs');
      const path = require('path');
      // Adjust path based on your project structure
      const fullPath = path.join(__dirname, '..', record.imagepath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Deleted file: ${fullPath}`);
      }
    }
    
    return { 
      success: true, 
      message: 'Gallery record deleted successfully.',
      deletedId: deleteResult.rows[0]?.id 
    };
    
  } catch (error) {
    console.error('DeleteUserGalleryRecord service error:', error);
    return { success: false, message: error.message };
  } finally {
    client.release();
  }
};
const GetUserDetailsById = async (uid) => {
  try {
    const client4 = await pool.connect();

    const query = {
      text: 'select * from userdetails WHERE uid = $1',
      values: [uid],
    };

    const res = await client4.query(query);

    // Close the connection
    client4.release(); // Use release() instead of end() to return the client to the pool
    return res.rows;


  } catch (error) {
    console.error('Error while getting data:', error);
  }
}

const SaveUserDetails = async (obj) => {
 
  try {
    const client = await pool.connect();

    
    const query = ` INSERT INTO userdetails ( uid, about, familyresidence, fathername, fatheroccupation, mothername, motheroccupation, brothers, sisters, brothersmarried, sistersmarried, nakshtra, padam, rasi, habitdrink, habitsmoke, degree, jobcity, diet, maritalstatus, partnerpreferences ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21 ) `

    const values = [obj.uid, obj.about, obj.familyResidence, obj.fatherName, obj.fatherOccupation, obj.motherName, obj.motherOccupation, obj.brothers, obj.sisters, obj.brothersMarried, obj.sistersMarried, obj.nakshtra, obj.padam, obj.rasi, obj.habitdrink, obj.habitsmoke, obj.degree, obj.jobCity, obj.diet, obj.maritalStatus, obj.partnerPreferences];



    await client.query(query, values);


    client.release();
    return true;

  } catch (error) {
    return false;
    console.error('Error while saving objects to the database:', error);
  }
}
const UpdateUserDetails = async (obj) => {
  console.log("essx", obj)
  try {
    const client = await pool.connect();
    const query = `
    UPDATE userdetails 
    SET 
      about = $2, 
      familyresidence = $3, 
      fathername = $4, 
      fatheroccupation = $5, 
      mothername = $6, 
      motheroccupation = $7, 
      brothers = $8, 
      sisters = $9, 
      brothersmarried = $10, 
      sistersmarried = $11, 
      nakshtra = $12, 
      padam = $13, 
      rasi = $14, 
      habitdrink = $15, 
      habitsmoke = $16, 
      degree = $17, 
      jobcity = $18, 
      diet = $19, 
      maritalstatus = $20, 
      partnerpreferences = $21
    WHERE 
      uid = $1
  `;

    const values = [
      obj.uid, obj.about, obj.familyResidence, obj.fatherName, obj.fatherOccupation, obj.motherName,
      obj.motherOccupation, obj.brothers, obj.sisters, obj.brothersMarried, obj.sistersMarried,
      obj.nakshtra, obj.padam, obj.rasi, obj.habitdrink, obj.habitsmoke, obj.degree, obj.jobCity,
      obj.diet, obj.maritalStatus, obj.partnerPreferences
    ];

    // const query = 'update userdetails set ustate = $1, ucountry= $2 where uid=$3';
    // const values = [obj.ustate, obj.ucountry, obj.uid];

    const res = await client.query(query, values);

    client.release();
    if (res.rowCount > 0) return true;
    return false;
  } catch (error) {
    return false;
    console.error('Error while saving objects to the database:', error);
  }
}
const FetchAllUserDetails = async (data) => {
  try {
    const client4 = await pool.connect();

    const query = {// join changed inner to LEFT
      text: `select
  a.uid, a.relation,a.ucreated,a.ufname,a.ulname,a.udob,a.utob,a.ugender,a.upob,a.upresentloc,a.uphone,a.uheight,a.ucaste,a.uemail,a.upassword,a.ujob,a.upackage,a.ucountry,
  a.ustate, b.uid,b.about,b.familyresidence,b.fathername,b.fatheroccupation,b.mothername,b.motheroccupation,b.brothers,b.sisters,b.brothersmarried,b.sistersmarried,b.nakshtra,
  b.padam,b.rasi,b.habitdrink,b.habitsmoke,b.degree,b.jobcity,b.diet,b.maritalstatus,b.partnerpreferences 
  from users as a LEFT join userdetails as b on a.uid = b.uid where a.uid = $1`,
      values: [data],
    };

    const res = await client4.query(query);

    // Close the connection
    client4.release(); // Use release() instead of end() to return the client to the pool
    return res.rows;


  } catch (error) { 
    console.error('Error while getting data:', error);
  }
} 
const heightToInches = (heightStr) => {
  if (!heightStr || typeof heightStr !== 'string') return null;
  
  // Handle formats like "5'8", "5'8\"", "5ft 8in", "5 feet 8 inches"
  const match = heightStr.match(/(\d+)['ft\s]*(\d*)/i);
  if (!match) return null;
  
  const feet = parseInt(match[1], 10);
  const inches = match[2] ? parseInt(match[2], 10) : 0;
  
  return (feet * 12) + inches;
};

// Helper function to parse annual income to rupees
const parseAnnualIncome = (incomeStr) => {
  if (!incomeStr || typeof incomeStr !== 'string') return null;
  
  const cleaned = incomeStr.trim().toLowerCase();
  
  // Extract number from string (e.g., "51 Lakhs" → "51")
  const numMatch = cleaned.match(/(\d+\.?\d*)/);
  if (!numMatch) return null;
  
  const num = parseFloat(numMatch[1]);
  if (isNaN(num) || num <= 0) return null;
  
  // Determine multiplier based on unit
  if (cleaned.includes('crore') || cleaned.includes('cr')) {
    return num * 10000000; // 1 Crore = 10,000,000
  } else if (cleaned.includes('lakh') || cleaned.includes('lac')) {
    return num * 100000; // 1 Lakh = 100,000
  } else if (cleaned.includes('thousand') || cleaned.includes('k')) {
    return num * 1000; // 1 Thousand = 1,000
  }
  
  // Default: assume Lakhs if no unit specified
  return num * 100000;
};

// Fetchlistdata service - supports basic & advanced filters with pagination
const Fetchlistdata = async ({
  gender,
  ageFrom,
  ageTo,
  maritalStatus,
  heightFrom,
  heightTo,
  country,
  state,
  city,
  caste,
  education,
  occupation, 
  annualIncome,
  workingLocation,
  page = 1,
  limit = 20
}) => {
  let client;
  try {
    client = await pool.connect();

    const p = Number(page) || 1;
    const l = Number(limit) || 20;
    const offset = (p - 1) * l;

    let where = " WHERE 1=1 AND a.profile_status = 'approved'";
    const params = [];

    // Gender filter - normalize
    if (gender && String(gender).trim() !== '') {
      const g = String(gender).trim().toLowerCase();
      const dbGender = g === 'male' ? 'Male' : (g === 'female' ? 'Female' : gender);
      params.push(dbGender);
      where += ` AND a.ugender = $${params.length}`;
    }

    // Age filters
    if (ageFrom !== undefined && ageFrom !== null && String(ageFrom).trim() !== '') {
      params.push(ageFrom);
      where += ` AND date_part('year', age(now(), to_date(a.udob, 'MM/DD/YYYY'))) >= $${params.length}`;
    }
    if (ageTo !== undefined && ageTo !== null && String(ageTo).trim() !== '') {
      params.push(ageTo);
      where += ` AND date_part('year', age(now(), to_date(a.udob, 'MM/DD/YYYY'))) <= $${params.length}`;
    }

    // Marital status
    if (maritalStatus && String(maritalStatus).trim() !== '') {
      params.push(maritalStatus);
      where += ` AND b.maritalstatus = $${params.length}`;
    }

    // ✅ FIXED: Height filters - convert to inches for proper comparison
    if (heightFrom !== undefined && heightFrom !== null && String(heightFrom).trim() !== '') {
      const heightFromInches = heightToInches(String(heightFrom));
      if (heightFromInches !== null) {
        params.push(heightFromInches);
        // Use a function to convert stored height to inches for comparison
        where += ` AND (
          CASE 
            WHEN a.uheight ~ '^\\d+''\\d*"?$' THEN 
              CAST(SUBSTRING(a.uheight FROM '^(\\d+)') AS INTEGER) * 12 + 
              COALESCE(CAST(NULLIF(SUBSTRING(a.uheight FROM '''(\\d+)'), '') AS INTEGER), 0)
            ELSE NULL 
          END
        ) >= $${params.length}`;
      }
    }
    
    if (heightTo !== undefined && heightTo !== null && String(heightTo).trim() !== '') {
      const heightToInches = heightToInches(String(heightTo));
      if (heightToInches !== null) {
        params.push(heightToInches);
        where += ` AND (
          CASE 
            WHEN a.uheight ~ '^\\d+''\\d*"?$' THEN 
              CAST(SUBSTRING(a.uheight FROM '^(\\d+)') AS INTEGER) * 12 + 
              COALESCE(CAST(NULLIF(SUBSTRING(a.uheight FROM '''(\\d+)'), '') AS INTEGER), 0)
            ELSE NULL 
          END
        ) <= $${params.length}`;
      }
    }

    // Location filters
    if (country && String(country).trim() !== '') {
      params.push(country);
      where += ` AND a.ucountry = $${params.length}`;
    }
    if (state && String(state).trim() !== '') {
      params.push(state);
      where += ` AND a.ustate = $${params.length}`;
    }
    if (city && String(city).trim() !== '') {
      params.push(city);
      where += ` AND a.upresentloc = $${params.length}`;
    }

    // Caste
    if (caste && String(caste).trim() !== '') {
      params.push(caste);
      where += ` AND a.ucaste = $${params.length}`;
    }

    // Education
    if (education && String(education).trim() !== '') {
      params.push(education);
      where += ` AND b.degree = $${params.length}`;
    }

    // Occupation
    if (occupation && String(occupation).trim() !== '') {
      params.push(occupation);
      where += ` AND a.ujob = $${params.length}`;
    }

    // ✅ FIXED: Annual Income - parse full string format
    if (annualIncome && String(annualIncome).trim() !== '') {
      const minIncome = parseAnnualIncome(String(annualIncome));
      if (minIncome !== null && minIncome > 0) {
        params.push(minIncome);
        // Compare with parsed income from database
        where += ` AND (
          CASE 
            WHEN a.upackage IS NULL OR a.upackage = 'NA' THEN 0
            WHEN LOWER(a.upackage) LIKE '%crore%' THEN 
              CAST(REGEXP_REPLACE(a.upackage, '[^0-9.]', '', 'g') AS NUMERIC) * 10000000
            WHEN LOWER(a.upackage) LIKE '%lakh%' OR LOWER(a.upackage) LIKE '%lac%' THEN 
              CAST(REGEXP_REPLACE(a.upackage, '[^0-9.]', '', 'g') AS NUMERIC) * 100000
            WHEN LOWER(a.upackage) LIKE '%thousand%' OR LOWER(a.upackage) LIKE '%k%' THEN 
              CAST(REGEXP_REPLACE(a.upackage, '[^0-9.]', '', 'g') AS NUMERIC) * 1000
            ELSE 
              CAST(REGEXP_REPLACE(a.upackage, '[^0-9.]', '', 'g') AS NUMERIC) * 100000
          END
        ) >= $${params.length}`;
      }
    }

    // Working Location
    if (workingLocation && String(workingLocation).trim() !== '') {
      params.push(workingLocation);
      where += ` AND b.jobcity = $${params.length}`;
    }

    // Count query
    const countText = `
      SELECT COUNT(*) AS total 
      FROM users as a 
      LEFT JOIN userdetails as b on a.uid = b.uid 
      ${where}
    `;
    const countValues = params.slice();
 
const dataText = `
  SELECT 
    a.uid, a.ucreated, a.ufname, a.ulname, a.udob, a.ugender, 
    a.uheight, a.ujob, a.upackage, a.upob, a.ucountry, a.ustate, 
    a.upresentloc, a.ucaste,
    b.about, b.degree, b.jobcity, b.maritalstatus, b.familyresidence,
    -- ✅ ADDED: Fetch profile images with privacy check
    (SELECT CASE WHEN a.hide_picture = true THEN NULL ELSE g.imagepath END FROM usergallery g WHERE g.uid = a.uid AND g.isprofile = true AND g.status = 'approved' LIMIT 1) AS profile_image,
    (SELECT CASE WHEN a.hide_picture = true THEN NULL ELSE g.imagepath_thumb END FROM usergallery g WHERE g.uid = a.uid AND g.isprofile = true AND g.status = 'approved' LIMIT 1) AS profile_image_thumb
  FROM users as a 
  LEFT JOIN userdetails as b on a.uid = b.uid
  ${where} 
  ORDER BY a.uid 
  LIMIT $${params.length + 1} 
  OFFSET $${params.length + 2}
`;

    const dataValues = params.concat([l, offset]);

    const [dataRes, countRes] = await Promise.all([
      client.query({ text: dataText, values: dataValues }),
      client.query({ text: countText, values: countValues })
    ]);

    return {
      rows: dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
      page: p,
      limit: l
    };
  } catch (error) {
    console.error('Fetchlistdata error:', error);
    throw error;
  } finally {
    if (client) client.release();
  }
};

module.exports.Fetchlistdata = Fetchlistdata;
const getAllUserDetails = async () => {
  try {
    const client3 = await pool.connect();
    const query = {
      text: 'select * from userdetails'
    };
    const res = await client3.query(query);
    // Close the connection
    client3.release(); // Use release() instead of end() to return the client to the pool
    return res.rows;
  } catch (error) {
    console.error('Error while getting data:', error);
  }
}

const UpdateUserRegistrationDetails = async (obj) => {
  try {
    const client = await pool.connect();

    const query = 'update public.users set upob = $1, upresentloc= $2, uheight= $3, ucaste= $4, ujob= $5 , ucountry= $6, ustate= $7, upackage=$8 where uid=$9';
    const values = [
      obj.pob,
      obj.city,
      obj.height,
      obj.caste,
      obj.profession,
      obj.country,
      obj.state,
      obj.package,
      obj.uid
    ];

    const res = await client.query(query, values);

    client.release();
    if (res.rowCount > 0) return true;
    return false;
  } catch (error) {
    return false;
    console.error('Error while saving objects to the database:', error);
  }
}


// Function to update isprofile based on id
const updateUserProfileStatus = async (id) => {
  try {
    const client = await pool.connect();
    // Check if isprofile is already true for the given id
    const checkQuery = 'SELECT isprofile FROM public.usergallery WHERE id = $1';
    const checkResult = await client.query(checkQuery, [id]);

    if (checkResult.rows.length > 0 && checkResult.rows[0].isprofile === true) {
      client.release();
      return { success: false, message: 'isprofile is already true for the given id' };
    }

    // Step 1: Update the specified row to true
    await client.query('UPDATE public.usergallery SET isprofile = TRUE WHERE id = $1', [id]);
    // Step 2: Update all other rows with the same uid to false
    await client.query(
      'UPDATE public.usergallery SET isprofile = FALSE WHERE uid = (SELECT uid FROM public.usergallery WHERE id = $1) AND id != $1',
      [id]
    );
    client.release();
    console.log('Profile status updated successfully.');
    return { success: true, message: 'Profile status updated successfully.' };
  } catch (error) {
    console.error('Error while updating profile status:', error);
    return { success: false, message: 'Error while updating profile status.' };
  }
};
const getPublicProfile = async (uid) => {  //added this public funtion 1
  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT 
        a.uid, a.ufname, a.ulname, a.udob, a.ugender,
        a.uheight, a.ucaste, a.ujob, a.upackage,
        a.upresentloc, a.ustate, a.ucountry,
        b.about, b.degree, b.maritalstatus,
        (SELECT g.imagepath FROM usergallery g 
         WHERE g.uid = a.uid AND g.isprofile = true 
         LIMIT 1) AS profile_pic
       FROM users a
       LEFT JOIN userdetails b ON a.uid = b.uid
       WHERE a.uid = $1`,
      [uid]
    );
    client.release();
    return result.rows[0] || null;
  } catch (error) {
    console.error('getPublicProfile error:', error);
    throw error;
  }
}; 
const saveOtp = async (email, otp) => {
  const client = await pool.connect();
  try {
    // Store OTP with 10 minute expiry
    await client.query(
      `INSERT INTO email_otps (email, otp, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
       ON CONFLICT (email)
       DO UPDATE SET otp = $2, expires_at = NOW() + INTERVAL '10 minutes', verified = false`,
      [email, otp]
    );
    return true;
  } catch (error) {
    console.error('saveOtp error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
const verifyOtp = async (email, otp) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * FROM email_otps
       WHERE email = $1 AND otp = $2
       AND expires_at > NOW() AND verified = false`,
      [email, otp]
    );
    if (result.rows.length === 0) return false;

    // Mark as verified
    await client.query(
      `UPDATE email_otps SET verified = true WHERE email = $1`,
      [email]
    );
    return true;
  } catch (error) {
    console.error('verifyOtp error:', error);
    throw error;
  } finally {
    client.release();
  }
};
//sidebar change password
// Get user password for validation
const getUserPassword = async (uid) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT upassword FROM users WHERE uid = $1`,
      [uid]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

// Update user password
const updateUserPassword = async (uid, newEncryptedPassword) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE users SET upassword = $1 WHERE uid = $2 RETURNING uid`,
      [newEncryptedPassword, uid]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
};

// Lazy-migration helper: rewrite the stored password for a user after a
// successful legacy (AES) login so the credential becomes a bcrypt hash.
const updateUserPasswordById = async (uid, newHash) => {
  const client = await pool.connect();
  try {
    await client.query('UPDATE users SET upassword = $1 WHERE uid = $2', [newHash, uid]);
  } finally {
    client.release();
  }
};
//close account
// ─── Close Account ────────────────────────────────────────────────────────────
const closeAccount = async (uid) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE users 
       SET upassword = 'Closed', status = 'Closed' 
       WHERE uid = $1 RETURNING uid`,
      [uid]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('closeAccount error:', error);
    throw error;
  } finally {
    client.release();
  }
};
// Update password by email (for forgot password flow)
const updatePasswordByEmail = async (email, newEncryptedPassword) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE users SET upassword = $1 WHERE uemail = $2 RETURNING uid`,
      [newEncryptedPassword, email]
    );
    return result.rowCount > 0;
  } finally {
    client.release();
  }
};
// ─────────────────────────────────────────────────────────────────────────────
// ADD to services/db.js
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. getPrivacySettings ────────────────────────────────────────────────────
// New function — add before module.exports block
const getPrivacySettings = async (uid) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT hide_email, hide_phone, hide_gallery, hide_picture
       FROM users WHERE uid = $1`,
      [uid]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('getPrivacySettings error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── 2. updatePrivacySettings ─────────────────────────────────────────────────
// New function — add before module.exports block
const updatePrivacySettings = async (uid, hide_email, hide_phone, hide_gallery, hide_picture) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE users
       SET hide_email   = $1,
           hide_phone   = $2,
           hide_gallery = $3,
           hide_picture = $4
       WHERE uid = $5
       RETURNING uid, hide_email, hide_phone, hide_gallery, hide_picture`,
      [hide_email, hide_phone, hide_gallery, hide_picture, uid]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('updatePrivacySettings error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── 3. REPLACE existing getUserMobile ────────────────────────────────────────
// Find existing getUserMobile in db.js and replace with this:
const getUserMobile = async (uid) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT uid, uphone, uemail, hide_phone, hide_email FROM users WHERE uid = $1`,
      [uid]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('getUserMobile error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── Contact-view limit helpers ───────────────────────────────────────────────

// Read an app setting (e.g. the daily contact-view limit) from app_settings.
// Returns the numeric value, or the provided fallback if the row is missing.
const getNumericSetting = async (key, fallback) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT value FROM app_settings WHERE key = $1`,
      [key]
    );
    const parsed = res.rows[0] ? parseInt(res.rows[0].value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  } catch (error) {
    console.error('getNumericSetting error:', error);
    return fallback; // fail open to the default limit if settings read fails
  } finally {
    client.release();
  }
};

// UPSERT an app setting into app_settings (e.g. the daily contact-view limit).
// Enforcement reads the value live via getNumericSetting, so a change here takes
// effect immediately on the next request.
const setNumericSetting = async (key, value) => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO app_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, String(value)]
    );
    return true;
  } catch (error) {
    console.error('setNumericSetting error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// How many DISTINCT profiles has this viewer unlocked today?
const getTodayContactViewCount = async (viewerId) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT COUNT(*) AS count FROM contact_views
         WHERE viewer_id = $1 AND viewed_on = CURRENT_DATE`,
      [viewerId]
    );
    return parseInt(res.rows[0].count, 10) || 0;
  } catch (error) {
    console.error('getTodayContactViewCount error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Has this viewer already unlocked THIS profile today? (re-views are free)
const hasViewedContactToday = async (viewerId, viewedUid) => {
  const client = await pool.connect();
  try {
    const res = await client.query(
      `SELECT 1 FROM contact_views
         WHERE viewer_id = $1 AND viewed_uid = $2 AND viewed_on = CURRENT_DATE
         LIMIT 1`,
      [viewerId, viewedUid]
    );
    return res.rows.length > 0;
  } catch (error) {
    console.error('hasViewedContactToday error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Record a contact view for today. ON CONFLICT keeps it idempotent so a repeat
// view of the same profile the same day doesn't create a duplicate / error.
const recordContactView = async (viewerId, viewedUid) => {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO contact_views (viewer_id, viewed_uid, viewed_on)
         VALUES ($1, $2, CURRENT_DATE)
         ON CONFLICT (viewer_id, viewed_uid, viewed_on) DO NOTHING`,
      [viewerId, viewedUid]
    );
    return { success: true };
  } catch (error) {
    console.error('recordContactView error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── 4. REPLACE existing GetUserGallery ───────────────────────────────────────
// Find existing GetUserGallery in db.js and replace with this:
// Now returns empty array if user has hidden their gallery (for other users)
// Caller must pass requesterId to check ownership
const GetUserGallery = async (uid, requesterId = null) => {
  const client = await pool.connect();
  try {
    // Check privacy settings first
    const privacyRes = await client.query(
      `SELECT hide_gallery, hide_picture FROM users WHERE uid = $1`,
      [uid]
    );
    const privacy = privacyRes.rows[0];
    const isOwner = requesterId && Number(requesterId) === Number(uid);

    // Fetch gallery.
    // Owner sees ALL their images (incl. pending/rejected, so they know status);
    // everyone else sees only APPROVED images (approval workflow).
    const result = isOwner
      ? await client.query(
          `SELECT * FROM usergallery WHERE uid = $1`,
          [uid]
        )
      : await client.query(
          `SELECT * FROM usergallery WHERE uid = $1 AND status = 'approved'`,
          [uid]
        );

    let rows = result.rows;

    if (!isOwner && privacy) {
      // Hide entire gallery if hide_gallery is set
      if (privacy.hide_gallery) return [];
      // Hide profile picture specifically if hide_picture is set
      if (privacy.hide_picture) {
        rows = rows.map(r => ({
          ...r,
          isprofile: false  // mask profile picture flag
        }));
      }
    }

    return rows;
  } catch (error) {
    console.error('GetUserGallery error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// ─── 5. ADD to module.exports at bottom of db.js ─────────────────────────────
// Add these two new lines:
//
 module.exports.getPrivacySettings    = getPrivacySettings;
module.exports.updatePrivacySettings = updatePrivacySettings;
//
// GetUserGallery and getUserMobile are already exported — no change needed.
module.exports.updatePasswordByEmail = updatePasswordByEmail;
module.exports.closeAccount = closeAccount;
module.exports.getUserPassword    = getUserPassword;
module.exports.updateUserPassword = updateUserPassword;
module.exports.updateUserPasswordById = updateUserPasswordById;
module.exports.saveOtp   = saveOtp;
module.exports.verifyOtp = verifyOtp;
//end registeration
module.exports.getUserMobile = getUserMobile;  // add to existing exports
module.exports.getNumericSetting       = getNumericSetting;
module.exports.setNumericSetting       = setNumericSetting;
module.exports.getTodayContactViewCount = getTodayContactViewCount;
module.exports.hasViewedContactToday    = hasViewedContactToday;
module.exports.recordContactView        = recordContactView;
module.exports.getPublicProfile = getPublicProfile;  // add to existing exports added 2

module.exports.register = register;
module.exports.GetAllUsers = GetAllUsers;
module.exports.GetUserById = GetUserById;
module.exports.GetUserDetails = GetUserDetails;
module.exports.SaveUserGallery = SaveUserGallery;
module.exports.GetUserGallery = GetUserGallery;
module.exports.DeleteUserGalleryRecord = DeleteUserGalleryRecord;

module.exports.GetUserDetailsById = GetUserDetailsById;
module.exports.SaveUserDetails = SaveUserDetails;
module.exports.UpdateUserDetails = UpdateUserDetails;
module.exports.FetchAllUserDetails = FetchAllUserDetails;
module.exports.Fetchlistdata = Fetchlistdata
module.exports.getAllUserDetails = getAllUserDetails
module.exports.UpdateUserRegistrationDetails = UpdateUserRegistrationDetails
module.exports.updateUserProfileStatus = updateUserProfileStatus
