const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const main = document.querySelector(".main");
const newChatButton = document.getElementById("newChatButton");

let conversationHistory = [];

const savedHistory = localStorage.getItem("vyronConversation");

if (savedHistory) {
    conversationHistory = JSON.parse(savedHistory);
}

const API_URL = "https://server-4f38wwd46-aisyahalfinaas-projects.vercel.app/api/chat";


function addMessage(message, sender) {

    const messageElement = document.createElement("div");

    messageElement.className = `message ${sender}`;

    if (sender === "ai") {

        messageElement.innerHTML = `
            <div class="avatar">V</div>

            <div class="bubble">
                <div class="message-name">VYRON</div>

                <p>${formatMessage(message)}</p>
            </div>
        `;

    } else {

        messageElement.innerHTML = `
            <div class="avatar">U</div>

            <div class="bubble">
                <div class="message-name">YOU</div>

                <p>${formatMessage(message)}</p>
            </div>
        `;
    }

    chatMessages.appendChild(messageElement);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function loadSavedConversation() {
    if (conversationHistory.length === 0) return;

    main.classList.add("chat-mode");

    conversationHistory.forEach((conversation) => {
        const text = conversation.parts?.[0]?.text;

        if (!text) return;

        if (conversation.role === "user") {
            addMessage(text, "user");
        }

        if (conversation.role === "model") {
            addMessage(text, "ai");
        }
    });
}

function formatMessage(message) {

    let text = message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Ubah bullet Markdown menjadi bullet yang bersih
    text = text.replace(
        /^[\t ]*\*[\t ]+(.*)$/gm,
        "• $1"
    );

    text = text.replace(
        /^[\t ]*-[\t ]+(.*)$/gm,
        "• $1"
    );

    // Bold
    text = text.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );

    // Italic
    text = text.replace(
        /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
        "<em>$1</em>"
    );

    // Numbered list
    text = text.replace(
        /^(\d+)\.\s+(.*)$/gm,
        "<span class=\"numbered-item\">$1.</span> $2"
    );

    // Line breaks
    text = text.replace(/\n/g, "<br>");

    return text;
}


function setLoading(isLoading) {

    const existing = document.getElementById("typingIndicator");

    if (isLoading) {

        if (existing) return;

        const typing = document.createElement("div");

        typing.id = "typingIndicator";
        typing.className = "message ai";

        typing.innerHTML = `
            <div class="avatar">V</div>

            <div class="bubble">
                <div class="message-name">VYRON</div>

                <p>Thinking<span class="dots"></span></p>
            </div>
        `;

        chatMessages.appendChild(typing);

        chatMessages.scrollTop = chatMessages.scrollHeight;

    } else {

        if (existing) {
            existing.remove();
        }
    }
}

messageInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        chatForm.requestSubmit();
    }

});

chatForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const message = messageInput.value.trim();

    if (!message) return;

    // Ubah VYRON dari welcome mode menjadi chat mode
    main.classList.add("chat-mode");

    // Tampilkan pesan user
    addMessage(message, "user");

    // Simpan pesan user ke memory
    conversationHistory.push({
        role: "user",
        parts: [
            {
                text: message
            }
        ]
    });

    localStorage.setItem(
        "vyronConversation",
        JSON.stringify(conversationHistory)
    );

    // Kosongkan input
    messageInput.value = "";


    // Tampilkan loading
    setLoading(true);


    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                history: conversationHistory
            })

        });


        const data = await response.json();


        setLoading(false);


        if (!response.ok) {

            addMessage(
                data.error || "Terjadi kesalahan pada server.",
                "ai"
            );

            return;
        }


        addMessage(data.reply, "ai");

        conversationHistory.push({
            role: "model",
            parts: [
                {
                    text: data.reply
                }
            ]
        });

        localStorage.setItem(
            "vyronConversation",
            JSON.stringify(conversationHistory)
        );

    } catch (error) {

        console.error(error);

        setLoading(false);

        addMessage(
            "Aku tidak bisa terhubung ke server VYRON. Pastikan server masih berjalan.",
            "ai"
        );
    }

});

loadSavedConversation();

newChatButton.addEventListener("click", () => {

    conversationHistory = [];

    localStorage.removeItem("vyronConversation");

    chatMessages.innerHTML = `
        <div class="message ai">
            <div class="avatar">V</div>

            <div class="bubble">
                <div class="message-name">VYRON</div>

                <p>
                    System online. 🎮<br>
                    What game are we talking about?
                </p>
            </div>
        </div>
    `;

    main.classList.remove("chat-mode");

    messageInput.focus();
});