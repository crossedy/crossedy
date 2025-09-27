import { defineComponent } from '@crossedy/wrapper-vue3';
import { setup } from '@/common/components/Title/Title';
import '@/common/components/Title/Title.scss';
import render from '@/common/components/Title/Title.cdy.vue';
import type { PropsFromSetupFn } from '@crossedy/wrapper-vue3/implement/buildProps';

export const CdyTitle = defineComponent(setup, render);

const ttt: PropsFromSetupFn<typeof setup> = {} as any;
