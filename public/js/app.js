// The Auth0 client, initialized in configureClient()
let auth0 = null;
let order_history = null;

const orderBig = async () => {
  try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    // Make the call to the API, setting the token
    // in the Authorization header
    const response = await fetch("/api/orderBig", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-order-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);
    
    order_history = order_history + ",Big";
    await setOrderHistory();
    updateUI();

} catch (e) {
    // Display errors in the console
    console.error(e);
  }
};

const orderSmall = async () => {
  try {

    // Get the access token from the Auth0 client
    const token = await auth0.getTokenSilently();

    // Make the call to the API, setting the token
    // in the Authorization header
    const response = await fetch("/api/orderSmall", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Fetch the JSON result
    const responseData = await response.json();

    // Display the result in the output element
    const responseElement = document.getElementById("api-order-result");

    responseElement.innerText = JSON.stringify(responseData, {}, 2);
    
    order_history = order_history + ",Small";
    await setOrderHistory();
    updateUI();

} catch (e) {
    // Display errors in the console
    console.error(e);
  }
};

const getAceessTokenForManagementAPI = async () => {
    let token;

    const obj = {    
        grant_type: 'client_credentials',
        client_id: '02Q223b2AP07qj4bScDEfMaaB9us0riA',
        client_secret: '1ES5GMDFwjTNobpgbu_iK9NlxOEBzzXLnlJQxha9S00htkhU4_CQA1qr29K-0fFr',
        audience: 'https://dev-vrryb7c1.jp.auth0.com/api/v2/'};
    const method = "POST";
    const body = Object.keys(obj).map((key)=>key+"="+encodeURIComponent(obj[key])).join("&");
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'};
        
    await fetch("https://dev-vrryb7c1.jp.auth0.com/oauth/token", {method, headers, body})
        .then((res)=> res.json())
        .then(json => {token = json.access_token})
        .catch(console.error);

    return token;
}

async function getOrderHistory() {
    const user = await auth0.getUser();
    const token = await getAceessTokenForManagementAPI();

    await fetch("https://dev-vrryb7c1.jp.auth0.com/api/v2/users/" + user.sub, 
        {method: "GET", headers: {Authorization: `Bearer ${token}`}})
        .then(response => response.json())
        .then(json => {order_history = json.user_metadata.order_history;})
        .catch(console.error);
}

async function setOrderHistory() {
    const user = await auth0.getUser();
    const token = await getAceessTokenForManagementAPI();
    const new_history = order_history;

    const data = {
        user_metadata: {
            order_history: new_history}};
    const body = JSON.stringify(data);
    
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`};

    await fetch("https://dev-vrryb7c1.jp.auth0.com/api/v2/users/" + user.sub, 
        {method: "PATCH", headers, body})
        .then(response => response.json())
        .catch(console.error);
}

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      redirect_uri: window.location.origin
    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    audience: config.audience
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");

      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");

    await getOrderHistory();

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};
