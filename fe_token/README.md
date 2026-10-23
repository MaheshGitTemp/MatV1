# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)



propsoals notification start
## Folder Structure

```
NodeBasicStructure/
├── controllers/
│   ├── dbController.js           ← existing
│   ├── tokenController.js        ← existing
│   └── proposalController.js     ← NEW (add here)
├── services/
│   ├── db.js                     ← existing
│   ├── pool.js                   ← existing
│   ├── passwordfunction.js       ← existing
│   └── proposal.js               ← NEW (add here)
├── routes/
│   └── index.js                  ← existing (replace with index_updated.js)
├── public/
│   └── dashboard.html            ← existing
├── app.js                        ← existing
├── package.json                  ← existing
├── .env                          ← existing
└── proposals_schema.sql          ← NEW (run in PostgreSQL, then can delete)
```

---

## All Proposal cURLs

### Step 0 — Login First (get cookies)
```bash
curl --location 'http://localhost:9012/api/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "uemail": "admin@admin.com",
  "upassword": "admin"
}' \
--cookie-jar cookies.txt
```

---

### 1. Send Proposal
```bash
curl --location 'http://localhost:9012/api/sendProposal' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "sender_id": 1,
  "receiver_id": 2
}'
```
**Success:**
```json
{
  "status": "Success",
  "result": "Proposal sent successfully.",
  "data": { "id": 1, "sender_id": 1, "receiver_id": 2, "status": "pending", "is_read": false }
}
```
**Already sent:**
```json
{ "status": "Failure", "result": "Proposal already sent." }
```

---

### 2. Get Notifications (Bell Icon Dropdown)
```bash
curl --location 'http://localhost:9012/api/getNotifications' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "receiver_id": 2
}'
```
**Success:**
```json
{
  "status": "Success",
  "unreadCount": 2,
  "data": [
    {
      "id": 1,
      "sender_id": 1,
      "status": "pending",
      "is_read": false,
      "ufname": "John",
      "ulname": "Doe",
      "created_at": "2024-08-01T13:03:00",
      "sender_profile_image": "path/to/image.jpg"
    }
  ]
}
```

---

### 3. Accept Proposal
```bash
curl --location 'http://localhost:9012/api/acceptProposal' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "proposal_id": 1,
  "receiver_id": 2
}'
```
**Success:**
```json
{
  "status": "Success",
  "result": "Proposal accepted.",
  "data": { "id": 1, "status": "accepted" }
}
```
**Already actioned:**
```json
{ "status": "Failure", "result": "Proposal not found or already actioned." }
```

---

### 4. Reject Proposal
```bash
curl --location 'http://localhost:9012/api/rejectProposal' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "proposal_id": 2,
  "receiver_id": 2
}'
```
**Success:**
```json
{
  "status": "Success",
  "result": "Proposal rejected.",
  "data": { "id": 2, "status": "rejected" }
}
```

---

### 5. Mark All Notifications as Read
```bash
curl --location 'http://localhost:9012/api/markNotificationsRead' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "receiver_id": 2
}'
```
**Success:**
```json
{ "status": "Success", "result": "Notifications marked as read." }
```

---

### 6. Get Unread Count (Badge on Bell Icon)
```bash
curl --location 'http://localhost:9012/api/getUnreadCount' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "receiver_id": 2
}'
```
**Success:**
```json
{ "status": "Success", "unreadCount": 3 }
```

---

### 7. Get Sent Proposals (My Requests Page)
```bash
curl --location 'http://localhost:9012/api/getSentProposals' \
--header 'Content-Type: application/json' \
--cookie cookies.txt \
--data '{
  "sender_id": 1
}'
```
**Success:**
```json
{
  "status": "Success",
  "data": [
    {
      "id": 1,
      "receiver_id": 2,
      "status": "accepted",
      "ufname": "Jane",
      "ulname": "Smith",
      "ucaste": "Jutt",
      "upresentloc": "Hyderabad",
      "receiver_profile_image": "path/to/image.jpg"
    }
  ]
}
```

---

## Quick Reference Table

| # | API | Method | Body Fields | Purpose |
|---|---|---|---|---|
| 1 | `/api/sendProposal` | POST | `sender_id`, `receiver_id` | Like a profile → send proposal |
| 2 | `/api/getNotifications` | POST | `receiver_id` | Load bell dropdown |
| 3 | `/api/acceptProposal` | POST | `proposal_id`, `receiver_id` | Accept a proposal |
| 4 | `/api/rejectProposal` | POST | `proposal_id`, `receiver_id` | Reject a proposal |
| 5 | `/api/markNotificationsRead` | POST | `receiver_id` | Clear bell badge on open |
| 6 | `/api/getUnreadCount` | POST | `receiver_id` | Badge count on bell icon |
| 7 | `/api/getSentProposals` | POST | `sender_id` | My Requests page |
propsl end