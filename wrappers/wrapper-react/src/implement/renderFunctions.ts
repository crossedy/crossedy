import { createElement, Fragment, type RefObject } from 'react';

function isEmpty(node: any): boolean {
	if (typeof node === 'undefined' || node === null || node === false) {
		return true;
	}
	if (node.type === Fragment) {
		return isEmpty(node.children) && isEmpty(node.props.children);
	}
	if (Array.isArray(node)) {
		return !node.filter((row) => !isEmpty(row)).length;
	}

	return false;
}


export const _ce = createElement;

// React.Fragment
export const _F = Fragment;

// className
export const _c = function (value: any): string {
	if (typeof value === 'undefined' || value === null) {
		return '';
	}
	if(typeof value === 'object') {
		if (Array.isArray(value)) {
			return value.map(v =>  v.toString()).join(' ').trim();
		}
		return Object.entries(value).map(([name, value]) => !!value ? name.toString() : '').join(' ').trim();
	}
	return value.toString().trim();
};

// each
export const _e = function (list: any, cb: any) {
	if (typeof list === 'number') {
		return Array.from({ length: list }).map((value, key) => cb(key+1, key));
	}
	if (typeof list === 'string') {
		list = list.split('');
	}
	if (typeof list === 'object') {
		if (Array.isArray(list)) {
			return list.map((value, key) => cb(value, key))
		}
		return Object.entries(list).map(([value, key]) => cb(value, key));
	}
	console.warn('Failed: No loop source, The source on v-for isn\'t traversable');
	return null;
};

// style
export const _s = function (css: any) {
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
					cssObject[property] = value.trim();
				}
			})
		;
		css = cssObject;
	}
	return Object.fromEntries(
		Object.entries(css)
			.map(([ property, value ]) => {
				if (!property.startsWith('--')) {
					property = property.trim().replace(/-([a-z])/g, (g) => g[1].toUpperCase());
				}
				return [ property, value ];
			})
	);
};

// renderSlot
export const _rs = function(first: any, second: any, args: any) {
	if (!isEmpty(first)) {
		if (typeof first === 'function') {
			return first(args);
		}
		return first;
	}
	if (!isEmpty(second)) {
		if (typeof second === 'function') {
			return second(args);
		}
		return second;
	}
	return null;
};

// Combine ref
export const _cr = function<T>(ref1: RefObject<T>, ref2: RefObject<T>): RefObject<T> {
	return {
		get current() {
			return ref1.current;
		},
		set current(value) {
			ref1.current = value;
			ref2.current = value;
		}
	}
}
