// ==UserScript==
// @name        DownloadForge
// @namespace   Violentmonkey Scripts
// @include     /https:\/\/www.curseforge.com\/.*\/.*\/.*\/files/
// @grant       none
// @version     1.0
// @author      PWall
// @grant GM.xmlHttpRequest
// @description 11/07/2021, 23:32:46
// ==/UserScript==

/*
	TODO: Use API https://docs.curseforge.com/#curseforge-core-api-files
	TODO: Use https://curse.tools/ instead of API
*/

const cdn = "https://media.forgecdn.net/files";
const api = "https://addons-ecs.forgesvc.net/api/v2/addon/mc/file/";

const get = (url) =>
	new Promise((resolve) => {
		GM.xmlHttpRequest({
			method: "GET",
			url,
			onload: function (response) {
				resolve(response);
			},
		});
	});

const fetchURL = async (id) => {
	const raw = await get(api + id + "/download-url");
	const url = raw.responseText;
	const fileName = url?.split("/").pop();
	const file = getLink(id, fileName);
	return file;
};

const getLink = (id, fileName) => {
	const result = [];
	result.push(cdn);
	result.push(parseInt(id.slice(0, 4)));
	result.push(parseInt(id.slice(-3)));
	result.push(encodeURIComponent(fileName));
	return result.join("/");
};

const getFile = () => {
	const spans = [...document.querySelectorAll("span")];
	const fileNameSpan = spans.find((e) => e.textContent == "Filename");
	const fileElement = fileNameSpan.parentElement.childNodes[3];
	return fileElement.textContent;
};

const setLinks = async ({ path, link, btn, files }) => {
	const id = path?.split("/").pop();
	const fileName = link.textContent.trim();

	if (files || fileName.slice(-4) == ".jar") {
		const file = getLink(id, files ?? fileName);

		link.addEventListener("click", () =>
			navigator.clipboard.writeText(file)
		);
		link.href = "javascript:";
		btn.href = file;

		return;
	}

	const copy = async () => {
		const url = await fetchURL(id);
		navigator.clipboard.writeText(url);
	};

	const goto = async (e) => {
		e.preventDefault();
		const url = await fetchURL(id);
		window.location.href = url;
	};

	link.addEventListener("click", copy);
	link.href = "javascript:";
	btn.addEventListener("click", goto);
};

const tableReplace = () => {
	const childs = document.querySelector("tbody")?.childNodes;
	childs.forEach((child) => {
		if (child.nodeName == "#text") {
			return;
		}
		const [link, btn] = child.querySelectorAll("[href]");
		const ver = replaceTag(child.querySelector(".mr-2"), "a");
		const path = link.href;

		setLinks({ path, link, btn });

		ver.href = path;
	});
};

const pageReplace = () => {
	const files = getFile();
	const path = location.pathname;
	const downloadPath = path.replace("files", "download");
	const link = document.querySelector(`[href="${path}"`);
	const btn = document.querySelector(`[href="${downloadPath}"`);
	setLinks({ path, files, link, btn });
};

const replaceTag = (element, newTag) => {
	const newChild = document.createElement(newTag);
	newChild.innerHTML = element.innerHTML;
	element.parentNode.replaceChild(newChild, element);
	return newChild;
};

const exec = () => {
	const pageRegex = /files\/[0-9]{7}/;
	if (pageRegex.test(location.pathname)) {
		pageReplace();
		return;
	}
	tableReplace();
};

exec();
