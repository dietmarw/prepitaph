import layout from "../layout.js";
import { html, RAW } from "../../ssg/html.js";

export async function document(article, { assets, config }) {
	let { css } = config;
	let styles = article.syntax ? css.default.concat(css.syntax) : css.default;
	return layout({
		title: article.title,
		content: await fragment(article, { config, isStandalone: true }),
		css: assets.register(styles),
		config
	});
}

export async function fragment(article, { config, isStandalone } = {}) {
	let ts = article.updated || article.created; // NB: design decision
	let timestamp = ts.toISOString().substring(0, 10);
	let date = ts.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric"
	});

	let title = isStandalone ?
		html`<h1>${article.title}</h1>` :
		html`<h2><a${{
			href: article.url(config.host, config.pathPrefix)
		}}>${article.title}</a></h2>`;

	let { intro } = article;
	intro = intro === null ? "" : html`<div class="teaser stack">${{
		[RAW]: await intro
	}}</div>`;

	let tag = { [RAW]: isStandalone ? "main" : "article" };
	return html`
<${tag} class="article stack">
	<header class="stack">
		${{ [RAW]: title }}
		<p class="metadata">
			by <b>${article.author}</b>
			<time${{ datetime: timestamp }}>${date}</time>
		</p>
		${{ [RAW]: intro }}
	</header>
	${isStandalone ? { [RAW]: await article.content } : ""}
</${tag}>
	`.trim();
}
