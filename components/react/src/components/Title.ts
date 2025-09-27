import type { HTMLAttributes } from 'react';
import { buildSetup, wrapComponent, type PropsFromSetupFn, buildProps, type CdyProps } from '@crossedy/wrapper-react';
import { setup } from '@/common/components/Title/Title';
import render from '@/common/components/Title/Title.cdy.vue';
import '@/common/components/Title/Title.scss';

export type TitleProps = PropsFromSetupFn<typeof setup, HTMLAttributes<HTMLHeadingElement>>;

function Title(props: CdyProps<TitleProps>) {
	props = buildProps(props, setup);
	return render(
		buildSetup(props, setup)
	);
}

export default wrapComponent(Title);
