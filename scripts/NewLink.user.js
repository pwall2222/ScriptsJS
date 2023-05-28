// ==UserScript==
// @name        NewLink
// @match       https://www.google.com/search
// @grant       none
// @version     0.1
// @author      PWall
// @run-at      document-end
// @grant       GM_getValue
// @noframes
// ==/UserScript==

const toMap = (o) => new Map(Object.entries(o));

const getStore = (k, d = {}) => GM_getValue(k, d);

const omitions = toMap(getStore("settings"));

const host = window.location.host;

const setBlank = (e) => {
	e.target = "_blank";
};

const shouldStay = (c) => {
	if (!omitions.has(host)) return false;
	if (c.id === omitions.get(host)) return true;
	if (!c.hasAttribute("href")) return true;
	if (c.getAttribute("href").startsWith("/")) return true;
	return false;
};

const checkAnchor = (anchorElement) => {
	if (shouldStay(anchorElement)) return;
	setBlank(anchorElement);
};

const checkChilds = (e) => e.querySelectorAll("a").forEach(checkAnchor);

const checkElement = (e) => {
	if (e.tagName.toLowerCase() !== "a") return;
	checkAnchor(e);
};

const getAddedNodes = (record) => record.flatMap((m) => [...m.addedNodes]);

const mutation = new MutationObserver((mutations) => {
	getAddedNodes(mutations).forEach((m) => {
		if (m.nodeType !== Node.ELEMENT_NODE) {
			return;
		}
		setTimeout(checkElement, 0, m);
		setTimeout(checkChilds, 0, m);
	});
});

mutation.observe(document.body, {
	childList: true,
	subtree: true,
});

const anchors = document.getElementsByTagName("a");

for (const link of anchors) {
	if (shouldStay(link)) {
		continue;
	}
	setBlank(link);
}
