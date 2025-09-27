<template>
	<div>
		<CdyTitle>H1 title</CdyTitle>
		<CdyTitle h-tag="h2">H2 title</CdyTitle>
		<CdyTitle h-tag="h2">H2 title</CdyTitle>
		<CdyTitle h-tag="h3" :style="{ background: 'red' }">H3 title styled</CdyTitle>
		<CdyTitle h-tag="h3" :class="{ cool: true }">H3 title styled</CdyTitle>
		<CdyTitle h-tag="h4" :bolded="titleBolded">H4 <button @click="titleBolded = !titleBolded">CHANGE</button></CdyTitle>
	</div>
</template>

<script lang="ts">
	import { defineComponent, ref, type PropType, DefineComponent, EmitFn } from 'vue';
	import { CdyTitle } from '@/components';


	export const App = defineComponent({
		components: {
			CdyTitle
		},
		setup() {

			const titleBolded = ref(true);

			return {
				titleBolded
			}
		}
	});

	export default App;
</script>
