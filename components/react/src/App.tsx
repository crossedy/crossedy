import { CdyTitle } from '@/components';
import { useRef, useState } from 'react';

function App() {

	const [ titleBolded, setTitleBolded ] = useState(true);

	return (
		<div>
			<CdyTitle hTag="h2" bolded style={{}} variant="primary" seoTag="h6"/>
			<CdyTitle>H1 title</CdyTitle>
			<CdyTitle hTag="h2">H2 title</CdyTitle>
			<CdyTitle hTag="h2">H2 title</CdyTitle>
			<CdyTitle hTag="h3" style={{ background: 'red' }}>H3 title styled</CdyTitle>
			<CdyTitle hTag="h3" className={{ cool: true }}>H3 title styled</CdyTitle>
			<CdyTitle hTag="h4" bolded={titleBolded}>H4 <button onClick={() => setTitleBolded(!titleBolded)}>CHANGE</button></CdyTitle>
		</div>
	)
}

export default App
