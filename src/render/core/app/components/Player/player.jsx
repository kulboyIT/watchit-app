import React from 'react'
import PropTypes from 'prop-types'
import setting from '@settings'

import PlayerShare from './share'
import PlayerVideo from './video'

import { DLNA as dlna } from '@main/bridge'
import HLS from '@main/core/hls'

import gatewayHelper from '@helpers/gateway'
import log from '@logger'

export default class Player extends React.Component {
  constructor (props) {
    super(props)
    this.v = null
    this.player = null

    // Initial State
    this.state = {
      devices: this.players || []
    }
  }

  shouldComponentUpdate (nextProps, nextState, nextContext) {
    return nextProps.canPlay
  }

  get players () {
    if (this.invalidDLNASource || !dlna) return []
    return dlna.players.map((d) => {
      return d.name
    })
  }

  static get defaultProps () {
    return {
      canPlay: false
    }
  }

  static get propTypes () {
    return {
      movie: PropTypes.object.isRequired,
      canPlay: PropTypes.bool.isRequired
    }
  }

  handleSelectDevice = (index) => {
    if (!dlna) return
    dlna.setPlayer(index.action)
    dlna.play(this.props.movie.title, this.state.url)
    this.player.pause()
  }

  async componentDidMount () {
    if (!this.invalidDLNASource) { this.initDLNA() }
    // Lets start watching :)
    this.startStreaming()
  }

  get invalidDLNASource () {
    // Check object type for streaming lib and avoid DLNA for invalid sources
    const blackListed = ['[object HLSStreaming]', '[object BrowserTorrentStreaming]']
    const currentStreamer = this.streamer.toString()
    return blackListed.some((el) => Object.is(currentStreamer, el))
  }

  initDLNA () {
    // DLNA init
    dlna && dlna.requestUpdate(
      // Update devices list
    ).on('status', (status) => {
      log.info('Status:' + status)
    }).on('device', (device) => {
      log.warn(`New device ${device}`)
      this.setState({ devices: this.players })
    })
  }

  _initPlaying = () => {
    if (this.props.onCanPlay && !this.props.canPlay) {
      this.props.onCanPlay()
    }
  }

  _ready () {
    log.info('Player ready')
    this._initPlaying()
  }

  startStreaming () {
    // Start streamer
    log.info('Streaming Movie: ' + this.props.movie.title.toUpperCase())
    const uriToStream = `${gatewayHelper.dummyParse(this.props.movie)}`
    const streamer = this.streamer.play(uriToStream, { videoRef: this.v.video })
    streamer.on('error', this.onError)
    streamer.on('ready', () => this._ready())
  }

  stopStreaming () {
    this.streamer.stop()
    this.streamer.removeAllListeners()
  }

  get streamer () {
    const _type = this.props.movie.type
    if (!setting.streaming.includes(_type)) {
      throw new Error('Not support streaming mechanism')
    }

    return {
      hls: HLS.getInstance()
    }[_type]
  }

  componentDidCatch (error, info) {
    log.error('Component Did Catch Error')
    log.error(error)
    log.info(info)
  }

  // destroy player on unmount
  componentWillUnmount () {
    log.warn('STREAMING STOPPED BY USER')
    this.stopStreaming()
    dlna && dlna.stop()
  }

  onError = (e) => {
    // Handle error
    this.props.onError && this.props.onError(e)
    log.error('Error while streaming')
    log.warn('Retrying...')
    this.stopStreaming()
    this.startStreaming()
  }

  getVideoRef = (ref) => {
    this.v = ref
  }

  render () {
    return (
      <div className={(this.props.canPlay && 'left relative full-height full-width') || 'invisible'}>
        <PlayerShare devices={this.state.devices} onChange={this.handleSelectDevice} />
        <PlayerVideo ref={this.getVideoRef} />
      </div>
    )
  }
}
