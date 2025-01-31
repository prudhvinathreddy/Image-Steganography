// Function to open tab and reset the content when switching tabs
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
    
    // Reset the content when switching tabs
    if (tabName === "encode") {
        reset("encode");
    } else if (tabName === "decode") {
        reset("decode");
    }
}

// Encode text into image using LSB algorithm
function encode() {
    var text = document.getElementById("encodeText").value; // Keep the text as is with spaces and special chars
    var passphrase = prompt("Enter a passphrase to encrypt the message:");

    if (!passphrase) {
        alert("Passphrase is required!");
        return;
    }

    // Encrypt text using passphrase with AES
    var encryptedText = CryptoJS.AES.encrypt(text, passphrase).toString();

    var imageInput = document.getElementById("encodeImageInput");
    var file = imageInput.files[0];

    if (!file) {
        alert("Please select an image file.");
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var image = new Image();
        image.onload = function() {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            // Convert encrypted text to binary
            var binaryText = textToBinary(encryptedText);

            // Encode text into image using LSB algorithm
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var textIndex = 0;
            for (var i = 0; i < imageData.data.length; i += 4) {
                if (textIndex < binaryText.length) {
                    // Modify least significant bit of each color component
                    imageData.data[i] = (imageData.data[i] & 0xFE) | parseInt(binaryText[textIndex++]);
                    imageData.data[i + 1] = (imageData.data[i + 1] & 0xFE) | parseInt(binaryText[textIndex++]);
                    imageData.data[i + 2] = (imageData.data[i + 2] & 0xFE) | parseInt(binaryText[textIndex++]);
                } else {
                    break;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            // Automatically download encoded image
            var encodedImageData = canvas.toDataURL();
            var dummyLink = document.createElement("a");
            dummyLink.href = encodedImageData;
            dummyLink.download = "encoded_image.png";
            dummyLink.click();

            // Show success popup
            showPopup("Image encoded and downloaded successfully!");
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Decode text from image using LSB algorithm
function decode() {
    var fileInput = document.getElementById("decodeInput");
    var file = fileInput.files[0];

    if (!file) {
        alert("Please select an image file.");
        return;
    }

    var passphrase = prompt("Enter the passphrase to decrypt the message:");

    if (!passphrase) {
        alert("Passphrase is required!");
        return;
    }

    var reader = new FileReader();
    reader.onload = function (e) {
        var image = new Image();
        image.onload = function() {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var binaryText = "";
            var byte = "";
            var charCode;
            for (var i = 0; i < imageData.data.length; i += 4) {
                byte += (imageData.data[i] & 0x01);
                byte += (imageData.data[i + 1] & 0x01);
                byte += (imageData.data[i + 2] & 0x01);
                if (byte.length >= 8) {
                    charCode = parseInt(byte.substr(0, 8), 2);
                    if (charCode === 0) break;
                    binaryText += String.fromCharCode(charCode);
                    byte = byte.slice(8);
                }
            }

            // Decrypt the message using the passphrase
            var decryptedBytes = CryptoJS.AES.decrypt(binaryText, passphrase);
            var decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);

            // Check if decryption was successful and the message is valid
            if (decryptedText === "") {
                alert("Incorrect passphrase or corrupted message.");
            } else {
                // Display decoded (decrypted) text
                document.getElementById("decodedText").innerText = "Decoded Text: " + decryptedText;
            }
        };
        image.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Convert text to binary
function textToBinary(text) {
    var binaryText = "";
    for (var i = 0; i < text.length; i++) {
        var binaryChar = text.charCodeAt(i).toString(2).padStart(8, '0');
        binaryText += binaryChar;
    }
    return binaryText;
}

// Reset function for switching tabs
function reset(tabName) {
    if (tabName === 'encode') {
        document.getElementById("encodeText").value = "";
        document.getElementById("encodeImageInput").value = "";
    } else if (tabName === 'decode') {
        document.getElementById("decodeInput").value = "";
        document.getElementById("decodedText").innerText = "";
    }
}

// Show success popup
function showPopup(message) {
    var popup = document.getElementById("popup");
    var popupOverlay = document.getElementById("popup-overlay");
    popup.innerText = message;
    popup.style.display = "block";
    popupOverlay.style.display = "block";

    setTimeout(function() {
        popup.style.display = "none";
        popupOverlay.style.display = "none";
    }, 2000); // Hide popup after 2 seconds
}

// Close the popup when clicked outside or on the close button
document.getElementById("popup-overlay").addEventListener("click", function() {
    closePopup();
});

document.querySelector(".close-btn").addEventListener("click", function(e) {
    e.stopPropagation(); // Prevent closing when clicking the close button itself
    closePopup();
});

// Close the popup function
function closePopup() {
    document.getElementById("popup").style.display = "none";
    document.getElementById("popup-overlay").style.display = "none";
}
