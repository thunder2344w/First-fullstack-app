
function getAuthToken() {
    return localStorage.getItem("authToken");
}

function getAuthHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function showMessage(element, text, color = "red") {
    if (!element) return;
    element.textContent = text;
    element.style.color = color;
    element.style.display = "block";
}

function redirectTo(page) {
    if (page.startsWith("/")) {
        page = page.slice(1);
    }
    window.location.href = page;
}

const friendUnreadCounts = new Map();

function getToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    return container;
}

function showToast(text, type = "info") {
    const container = getToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = text;
    container.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("toast-fade");
    }, 3200);
    window.setTimeout(() => {
        toast.remove();
    }, 4000);
}

// redirect login from index to login if token is not valid
async function checkAuth() {
    const token = getAuthToken();
    if (!token) return false;

    try {
        const res = await fetch("/api/profile", {
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
            },
        });
        if (!res.ok) {
            localStorage.removeItem("authToken");
            return false;
        }
        return true;
    } catch {
        localStorage.removeItem("authToken");
        return false;
    }
}


if (window.location.pathname.includes("index.html")) {
    checkAuth().then((isAuth) => {
        if (!isAuth) {
            redirectTo("login.html");
        }
    });
}

// if already login redirect from login to index if valid token
if (window.location.pathname.includes("login.html")) {
    checkAuth().then((isAuth) => {
        if (isAuth) {
            redirectTo("index.html");
        }
    });
}


const signupForm = document.getElementById("signupForm");

if (signupForm) {
    const signupMessage = document.getElementById("message");
    signupMessage.textContent = "";
    signupForm.addEventListener("input", () => {
        signupMessage.textContent = "";
    });

    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const submitBtn = signupForm.querySelector("button");
        signupMessage.textContent = "";
        signupMessage.style.color = "black";

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!name || !email || !password) {
            signupMessage.textContent = "Please fill in all fields.";
            signupMessage.style.color = "red";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Loading...";

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showMessage(signupMessage, data.message || "Signup successful.", "#3dd0a0");
                redirectTo("login.html");
                return;
            }

            showMessage(signupMessage, data.message || `Signup failed. (${response.status})`);
        } catch (error) {
            console.error(error);
            showMessage(signupMessage, "Server error. Try again later.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Signup";
        }
    });
}

// Login form

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    const loginMessage = document.getElementById("message");
    loginMessage.textContent = "";
    loginForm.addEventListener("input", () => {
        loginMessage.textContent = "";
    });

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const submitBtn = loginForm.querySelector("button");
        loginMessage.textContent = "";
        loginMessage.style.color = "black";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        if (!email || !password) {
            loginMessage.textContent = "Please enter both email and password.";
            loginMessage.style.color = "red";
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = "Loading...";
        showMessage(loginMessage, "Checking credentials...", "#9fc5ff");

        try {
            console.debug("Login submit", { email, passwordPresent: Boolean(password) });
            const res = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json().catch((jsonErr) => {
                console.warn("Login response JSON parse failed", jsonErr);
                return {};
            });

            console.debug("Login response", res.status, data);
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";

            if (!res.ok) {
                const errorMessage = data.message || `Login failed. Status ${res.status}`;
                showMessage(loginMessage, errorMessage);
                return;
            }

            if (!data.token) {
                showMessage(loginMessage, data.message || "Login failed: no token returned.");
                return;
            }

            localStorage.setItem("authToken", data.token);
            showMessage(loginMessage, "Login successful", "#3dd0a0");
            redirectTo("index.html");
        } catch (err) {
            console.error("Login request failed", err);
            showMessage(loginMessage, "Server error. Try again later.");
            submitBtn.disabled = false;
            submitBtn.textContent = "Login";
        }
    });
}

// Profile 

const profileDev = document.getElementById("profile");
const message = document.getElementById("message");

if (profileDev) {

    fetch("/api/profile", {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error("Unauthorized");
            }
            return res.json();
        })
        .then((data) => {
            profileDev.innerHTML = `
            <p>Email: ${data.user.email}</p>
            <p>User ID: ${data.user.id}</p>
            `;
        })
        .catch(() => {
            message.textContent = "Session expired please login again.";
            redirectTo("login.html");
        });

}

// fetch friend requests
const friendRequestsDiv = document.getElementById("friendRequests");

if (friendRequestsDiv) {
    fetch("/api/friends/requests", {
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.friendRequests.length === 0) {
                friendRequestsDiv.innerHTML = "<p>No friend Requests</p>";
                return;
            }

            data.friendRequests.forEach(user => {
                const div = document.createElement("div");
                div.innerHTML = `
            <p>${user.name} (${user.email})</p>
            <button onclick="respondRequest('${user._id}', 'accept')">Accept</button>
            <button onclick="respondRequest('${user._id}', 'reject')">Reject</button>
            `;
                friendRequestsDiv.appendChild(div);
            });
        });
}

// fetch friends list
const friendsListDiv = document.getElementById("friendsList");

async function loadFriendsList() {
    if (!friendsListDiv) return;

    try {
        const res = await fetch("/api/friends", {
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
            },
        });
        const data = await res.json();

        if (!Array.isArray(data.friends) || data.friends.length === 0) {
            friendsListDiv.innerHTML = "<p>No friends yet</p>";
            return;
        }

        friendsListDiv.innerHTML = "";
        data.friends.forEach(friend => {
            const notification = friend.unreadCount ? ` <span class="badge">${friend.unreadCount}</span>` : "";
            const div = document.createElement("div");
            div.className = "friend-row";
            div.innerHTML = `
                <div class="friend-meta">
                  <div>
                    <p class="friend-name">${friend.name}${notification}</p>
                    <p class="friend-email">${friend.email}</p>
                  </div>
                  <div class="friend-actions">
                    <button onclick="removeFriend('${friend._id}')">Remove</button>
                    <button onclick="openChat('${friend._id}', '${encodeURIComponent(friend.name)}')">Chat</button>
                  </div>
                </div>
            `;
            friendsListDiv.appendChild(div);
        });
    } catch (err) {
        friendsListDiv.innerHTML = "<p>Unable to load friends.</p>";
        console.error(err);
    }
}

if (friendsListDiv) {
    loadFriendsList();
    setInterval(loadFriendsList, 20000);
}

// send request to friend from frontend logic
const sendRequestBtn = document.getElementById("sendRequestBtn");

if (sendRequestBtn) {
    sendRequestBtn.addEventListener("click", async () => {

        const email = document.getElementById("friendEmail").value;
        const message = document.getElementById("sendRequestMesssage");
        message.textContent = "";

        if (!email) {
            message.textContent = "Please enter an email";
            message.style.color = "red";
            return;
        }

        sendRequestBtn.disabled = true;
        sendRequestBtn.textContent = "Sending...";
        message.textContent = "";

        try {
            const res = await fetch("/api/friends/request", {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            message.textContent = "Friend request sent ✅";
            message.style.color = "green";
            sendRequestBtn.textContent = "Request Sent";

        } catch (err) {
            message.textContent = err.message;
            message.style.color = "red";
            sendRequestBtn.disabled = false;
            sendRequestBtn.textContent = "Send Request";
        }
    });
}

// pending send requests
const sentRequestsDiv = document.getElementById("sentRequests");
if (sentRequestsDiv) {
    fetch("/api/friends/sent", {
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
    })
        .then(res => res.json())
        .then(data => {
            if (data.sentRequests.length === 0) {
                sentRequestsDiv.innerHTML = "<p>No pending sent requests</p>";
                return;
            }

            data.sentRequests.forEach(user => {
                const div = document.createElement("div");
                div.innerHTML = `<p>${user.name} (${user.email})</p>`;
                sentRequestsDiv.appendChild(div);
            });
        });
}

// Accept and reject friendRequest button logic
function respondRequest(senderId, action) {
    fetch("/api/friends/respond", {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ senderId, action }),
    })
        .then(res => res.json())
        .then(data => {
            message.textContent = data.message || "Request updated";
            message.style.color = "green";
            window.location.reload();
        })
        .catch((err) => {
            message.textContent = err.message || "Unable to update request";
            message.style.color = "red";
        });
}

// remove friend button
function removeFriend(friendId) {
    fetch("/api/friends/remove", {
        method: "POST",
        headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId }),
    })
        .then(res => res.json())
        .then(data => {
            message.textContent = data.message || "Friend removed";
            message.style.color = "green";
            window.location.reload();
        })
        .catch((err) => {
            message.textContent = err.message || "Unable to remove friend";
            message.style.color = "red";
        });
}


// Logout Button
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        localStorage.removeItem("authToken");
        try {
            await fetch("/api/logout", {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
            });
        } catch (err) {
            console.error("Logout error", err);
        } finally {
            redirectTo("login.html");
        }
    });
}

// load chat history
const params = new URLSearchParams(window.location.search);
const friendId = params.get("friend");
const friendName = params.get("name") ? decodeURIComponent(params.get("name")) : null;

const chatBox = document.getElementById("chatBox");
const chatHeader = document.getElementById("chatFriendName");
const chatSubtitle = document.getElementById("chatFriendSubtitle");

if (chatHeader) {
  chatHeader.textContent = friendName ? `Chat with ${friendName}` : "Chat";
}
if (chatSubtitle) {
  chatSubtitle.textContent = friendName ? `Messaging ${friendName}` : `Send messages to your friend.`;
}

function buildMessageItem(msg) {
  const div = document.createElement("div");
  const isSentByMe = msg.fromMe === true;
  div.className = `chat-message ${isSentByMe ? "sent" : "received"}`;
  const senderName = isSentByMe ? "You" : (msg.sender ? msg.sender.name : "Friend");
  const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  div.innerHTML = `
    <div class="message-bubble">
      <div class="message-meta">
        <span class="message-sender">${senderName}</span>
        <span class="message-time">${timestamp}</span>
      </div>
      <p>${msg.text}</p>
    </div>
  `;
  return div;
}

if (chatBox && friendId) {
  fetch(`/api/chat/${friendId}`, {
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Unable to load chat");
      }
      return res.json();
    })
    .then(messages => {
      chatBox.innerHTML = "";
      messages.forEach(msg => {
        chatBox.appendChild(buildMessageItem(msg));
      });
    })
    .catch(err => {
      showMessage(message, err.message);
    });
} else if (chatBox) {
  showMessage(message, "No friend selected for chat. Open a chat from the friends list.");
}

// send message
const chatForm = document.getElementById("chatForm");

if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const input = document.getElementById("messageInput");
    const text = input.value.trim();

    if (!friendId) {
      showMessage(message, "No friend selected for chat.");
      return;
    }

    if (!text) {
      showMessage(message, "Please type a message before sending.");
      return;
    }

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId: friendId, text }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to send message.");
      }

      input.value = "";
      const newMessage = data.data;
      if (newMessage) {
        chatBox.appendChild(buildMessageItem(newMessage));
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      showMessage(message, "Message sent", "#3dd0a0");
    } catch (err) {
      console.error(err);
      showMessage(message, err.message || "Unable to send message.");
    }
  });
}

function openChat(friendId, friendName) {
  const encodedName = encodeURIComponent(friendName || "");
  window.location.href = `chat.html?friend=${friendId}&name=${encodedName}`;
}

