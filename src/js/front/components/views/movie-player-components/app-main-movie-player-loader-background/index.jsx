import React from 'react'
import Particles from 'react-particles-js';
import config from './particleConfig'
import Logo from 'js/front/components/generic/util-header-logo'

export default class AppLoaderBackground extends React.Component {

	shouldComponentUpdate() {
		return false
	}

	render() {
		return (
			<div className="particles_container">
				<Particles width="100%" height="100%" params={config}/>
				<Logo />
				<span className="slogan">watch movies for free</span>
			</div>
		)
	}
}
