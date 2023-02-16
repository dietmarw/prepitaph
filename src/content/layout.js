import { html, RAW } from "../ssg/html.js";

export default ({ title, content, css = [], config }) => {
	title = title.isStandalone ? title.text : `${title} | ${config.siteTitle}`;
	// NB: layout will always be EN
	return html`
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8">
	<title>${title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1">
	${{
		[RAW]: css.
			map(uri => html`<link rel="stylesheet"${{ href: uri }}>`).
			join("\n")
	}}
</head>

<body class="stack">
	<header class="site-header">
		<nav>
			<a href="index.html" class="home"><b>prepitaph</b></a>
			<a href="index.html">articles</a>
			<a href="about.html">about</a>
		</nav>
	</header>
	${{ [RAW]: content }}
</body>

</html>
	`.trim();
};
