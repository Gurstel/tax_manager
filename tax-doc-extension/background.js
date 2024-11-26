// background.js
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: "window.html",
    type: "popup",
    width: 400,
    height: 300,
  });
});
