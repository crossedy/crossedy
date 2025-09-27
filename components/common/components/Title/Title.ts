import { computed, prop, type Ctx } from '@crossedy/wrapper-common';

export type HTag = 'h1'|'h2'|'h3'|'h4'|'h5'|'h6';
export type TitleVariant = 'primary'|'secondary';

export interface TitleProp {
	/**
	 * Tag of title with css apply
	 */
	hTag?: HTag;

	/**
	 * SEO Tag is explicit tag write in DOM
	 */
	seoTag?: HTag;

	/**
	 * Apply bolded transormation
	 */
	bolded?: boolean;

	/**
	 * Differente variant of Tag
	 */
	variant?: TitleVariant;
}

export function setup(ctx: Ctx) {

	const hTag = prop<TitleProp['hTag']>({ type: String, default: () => 'h1' });
	const seoTag = prop<TitleProp['seoTag']>({ type: String });
	const bolded = prop<TitleProp['bolded']>({ type: Boolean, default: () => false });
	const variant = prop<TitleProp['variant']>({ type: String, default: () => 'primary' });

	const className = computed(() => [
		ctx.$class(),
		'cdy-title',
		`cdy-title--${hTag.value}`,
		bolded.value ? 'cdy-title--bolded' : '',
		`cdy-title--${variant.value}`,
	], [ hTag, bolded, variant ]);

	const finalTag = computed(() => seoTag.value || hTag.value, [
		hTag, seoTag
	])

	return {
		hTag,
		seoTag,
		bolded,
		variant,
		className,
		finalTag,
	};
}
