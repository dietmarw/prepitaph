import { siteTitle } from "./index.js"; // XXX: circular
import { renderMarkdown } from "../ssg/markdown.js";
import { txt2blocks } from "../ssg/ingestion.js";
import { html, RAW } from "../ssg/html.js";
import Prism from "prismjs";

let { highlight, languages } = Prism;

export let _html = await code("html");
export {
	markdown as "default", // awkward, but necessary
	markdown,
	markdown as intro,
	_html as html
};
export let NONE = (content, params, context) => html`<pre>${content}</pre>`;
export let javascript = await code("javascript");
export let python = await code("python");

export async function feed(content, { category, title = siteTitle }, context) {
	let { renderAtom } = await import("./feed.js");
	let pages = sortByDate(context.store.retrieve(category));
	return renderAtom(pages, title, context);
}

export async function topics(content, { category }, context) {
	let byTag = new Map();
	let tags = [];
	for(let page of context.store.retrieve(category)) {
		for(let tag of page.tags) {
			let entries = byTag.get(tag);
			if(entries) {
				entries.push(page);
			} else {
				byTag.set(tag, [page]);
				tags.push(tag);
			}
		}
	}
	let { baseURL } = context.config;
	return html`<dl class="topics">${{
		[RAW]: tags.sort().map(tag => {
			return html`<dt>${tag}</dt><dd><div>${{
				[RAW]: byTag.get(tag).map(page => html`
					<a${{ href: page.url(baseURL).pathname }}>${page.title}</a>
				`.trim()).join(",</div><div>")
			}}</div></dd>`;
		}).join("\n")
	}}</dl>`;
}

export async function list(content, { category }, context) {
	let pages = sortByDate(context.store.retrieve(category));
	let res = [];
	for(let page of pages) {
		let html = page.render(context, { isStandalone: false });
		res.push(html);
	}
	res = await Promise.all(res);
	return res.join("\n");
}

export async function aside(content, { compact = false, backticks = "'''" }, context) {
	content = content.replaceAll(backticks, "```");
	return html`<aside class="${compact && "is-compact "}stack">${{
		[RAW]: await context.transformer.render(txt2blocks(content), context)
	}}</aside>`;
}

export async function footnote(content, params, context) {
	let name = Object.keys(params)[0];
	let i = context.footnotes.indexOf(name) + 1;
	return html`<div${{ id: `fn:${name}` }} class="footnote stack"><sup>${i}</sup>${{
		[RAW]: await context.transformer.render(txt2blocks(content), context)
	}}</div>`;
}

async function markdown(content, { allowHTML }, context) {
	let html = await renderMarkdown(content, {
		fragIDs: txt => txt.replace(/\s/g, "-").toLowerCase(), // XXX: crude
		allowHTML: allowHTML === "true",
		resolveURI(uri, type, node) {
			if(uri === "footnote://") {
				let { footnotes } = context;
				let text = node.firstChild;
				let name = text.literal;
				text.literal = footnotes.push(name);
				return `#fn:${name}`;
			} else if(uri.startsWith("page://")) {
				let page = context.store.resolve(uri.substring(7));
				return page.url(context.config.baseURL).pathname;
			}
			return uri;
		}
	});
	// hack to work around excessive HTML sanitization disallowing `data:` URIs
	return html.replaceAll('<img src="inline://', '<img src="data:');
}

async function code(lang, grammar = lang) {
	grammar = languages[grammar];
	if(!grammar) {
		let { default: loadLanguages } = await import("prismjs/components/index.js");
		loadLanguages([lang]);
		return code(lang, grammar);
	}
	return (content, params, context) => {
		return html`<pre><code${{ class: `language-${lang}` }}>${{
			[RAW]: highlight(content, grammar, lang)
		}}</code></pre>`;
	};
}

function sortByDate(pages) {
	return [...pages].sort((a, b) => (b.updated || b.created) - (a.updated || a.created));
}
