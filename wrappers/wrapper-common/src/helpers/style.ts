export function styleToObject(css: any): any {
	if (!css) {
		return {};
	}
	if (typeof css === 'string') {
		const cssArray = css.split(';');
		const cssObject: any = {};

		cssArray
			.map(style => style.trim())
			.filter(style => !!style)
			.forEach((style) => {
				const [property, value] = style.split(':');

				if (property && value) {
					const jsProperty = property.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
					cssObject[jsProperty] = value.trim();
				}
			})
		;

		return cssObject;
	}
	return css;
}
