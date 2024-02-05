// ==UserScript==
// @name         Extract and Trigger Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Generate Anki Flashcards from Uworld
// @author       cbxss
// @match        https://apps.uworld.com/courseapp/gradschool/v29/testinterface/launchtest/*/*/*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(async function () {
    'use strict';

    const apiKey = 'APIKEYHERE';
    const instructions = 'These are your instructions. You MUST FOLLOW THEM. Role and Goal: This GPT is an expert in the medical field, designed to help students study for the MCAT by generating Anki flashcards tailored to their study needs. It delivers flashcard data in a straightforward, concise format suitable for API integration, focusing solely on the flashcard content without any introductory or concluding remarks. Constraints: The GPT should avoid outdated or incorrect medical information, focus on high-quality, concise, relevant flashcards that align with the MCAT syllabus, and only output three flashcards in a response, formatted as "QUESTION"; "ANSWER" for each card, split each card with a new line. Also for each card, append {{c1::}} to the end of the question inside of the quotations. Do NOT have the text QUESTION or ANSWER inside of the question and answer. Guidelines: Users are encouraged to provide topics or specific questions theyre struggling with, so the GPT can generate targeted flashcards. Personalization: While maintaining a supportive and encouraging tone, the GPT will focus entirely on delivering flashcard data, omitting any introductory or concluding text to streamline the response for API use.'

    // Function to call ChatGPT with extracted text
    async function callChatGPT(message, options = {}) {

        var data = JSON.stringify({
                    'model': 'gpt-4', // You can replace with 'gpt-4'
                    'messages': [
                    { 'role': 'system', 'content': instructions },
                    { 'role': 'user', 'content': message } // Ensure this is a string representing the user's message
                ],
                    ...options
                })
        console.log(data)
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: 'https://api.openai.com/v1/chat/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                
                data,
                
                onload: (response) => {
                    const responseData = JSON.parse(response.responseText);
                    console.log(responseData)

                    if (response.status === 200 && responseData.choices) {
                        resolve(responseData.choices[0].message.content);
                    } else {
                        reject(new Error('API Error: ' + response.statusText));
                    }
                },
                onerror: (error) => {
                    reject(error);
                }
            });
        });
    }

    // Function to download text as a file
    var downloadTextAsFile = function (filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Asynchronously extract text and interact with ChatGPT API
    var extractTextAndCallChatGPT = async function () {
        var questionInformation = document.getElementById('explanation');
        if (questionInformation) {
            var text = '';
            var nodes = questionInformation.querySelectorAll('*');

            nodes.forEach(function (node) {
                text += node.textContent + ' ';
            });
            try {
                text = text.replace(/ +(?= )/g,'');
                const chatGPTResponse = await callChatGPT(text.trim());
                downloadTextAsFile("response.txt", chatGPTResponse);
            } catch (error) {
                console.error('Error calling ChatGPT:', error);
                alert('Failed to call ChatGPT');
            }
        }
    };

    // Function to wait for the dynamic element and then add a button
    var waitForElement = function () {
        var observer = new MutationObserver(function (mutations, obs) {
            var headers = document.getElementsByClassName('mcatQuestionHeader');
            if (headers.length > 0) {
                for (var i = 0; i < headers.length; i++) {
                    if (headers[i].childElementCount > 0) { // Check if the element has children
                        var button = document.createElement('button');
                        button.textContent = 'Extract and Analyze Text';
                        button.addEventListener('click', extractTextAndCallChatGPT);
                        headers[i].appendChild(button);
                    }
                }
                obs.disconnect(); // Stop observing once we've added the button
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    // Execute waitForElement function when the page is loaded
    window.addEventListener('load', waitForElement);
})();
