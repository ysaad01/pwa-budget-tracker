/* Indexed DB Functionality */

/* create variable for db connection */
let db;

/* create IndexedDB connection to "budget" db and set it to version 1 */
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  /* save reference to db */
  db = event.target.result;

  /* create object store named "new_transaction" and sets autoincrementing primary key */
  db.createObjectStore("new_transaction", { autoIncrement: true });
};
/* successful event */
request.onsuccess = function (event) {
  db = event.target.result;

  /* check if app is online - if yes it will trigger the uploadTransactions() function to run and send all local db data to api*/
  if (navigator.onLine) {
    uploadTransactions(db);
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

/* this function will trigger if user tries to submit new transaction with no internet connection */
function saveRecord(record) {
  /* open new db transaction with read and write permissions */
  const transaction = db.transaction(["new_transaction"], "readwrite");

  /* access object store for "new_transaction" */
  const transactionObjectStore = transaction.objectStore("new_transaction");

  /* add record to store */
  transactionObjectStore.add(record);
}

/* function uploadts data from IndexedDB store to the db */
function uploadTransactions() {
  //* open a new IndexedDB db transction */
  const transaction = db.transaction(["new_transaction"], "readwrite");

  /* access object store for "new_transaction" */
  const transactionObjectStore = transaction.objectStore("new_transaction");

  /* get all records from store and set to a variable */
  const getAll = transactionObjectStore.getAll();

  /* this function will trigger upon a successful .getAtt() execution */
  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(["new_transaction"], "readwrite");
          // access the new transaction object store
          const transactionObjectStore =
            transaction.objectStore("new_transaction");
          // clear all items in the store
          transactionObjectStore.clear();

          alert("All saved transactions have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

/* Event Listener for when app is back online */
window.addEventListener("online", uploadTransactions);
