chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'getTabGroups') {
        chrome.tabGroups.query({ "windowId": message.windowId }, function (groups) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message); // エラーメッセージを表示
                sendResponse({ groups: [] }); // 空のリストを返す
            } else {
                sendResponse({ groups: groups });
            }
        });
        return true; // 非同期応答のため、trueを返す必要があります
    }
});
