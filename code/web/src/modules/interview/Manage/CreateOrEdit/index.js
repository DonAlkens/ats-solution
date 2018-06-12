// Imports
import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import isEmpty from 'validator/lib/isEmpty'
import Datetime from 'react-datetime'

// UI Imports
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Typography from '@material-ui/core/Typography'
import Tooltip from '@material-ui/core/Tooltip'
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import FormControl from '@material-ui/core/FormControl'
import IconButton from '@material-ui/core/IconButton'
import IconCheck from '@material-ui/icons/Check'
import IconClose from '@material-ui/icons/Close'
import Zoom from '@material-ui/core/Zoom'
import { withStyles } from '@material-ui/core/styles'
import styles from './styles'

// App Imports
import params from '../../../../setup/config/params'
import { nullToEmptyString } from '../../../../setup/helpers'
import { getListByClient as getCandidateListByClient } from '../../../candidate/api/actions/query'
import { getListByClient as getInterviewListByClient } from '../../../panel/api/actions/query'
import { createOrUpdate, editClose } from '../../api/actions/mutation'
import { messageShow } from '../../../common/api/actions'
import Loading from '../../../common/Loading'

// Component
class CreateOrEdit extends PureComponent {
  constructor(props) {
    super(props)

    this.interview = {
      id: '',
      clientId: props.clientId,
      candidateId: '',
      panelId: '',
      dateTime: ''
    }

    this.state = {
      isLoading: false,

      ...this.interview
    }
  }

  componentDidMount() {
    const { getCandidateListByClient, getInterviewListByClient, clientId } = this.props

    getCandidateListByClient({ clientId })
    getInterviewListByClient({ clientId })
  }

  componentWillReceiveProps(nextProps) {
    const { interview } = nextProps.interviewEdit

    if(interview && interview._id !== this.state.id) {
      this.setState({
        id: interview._id,
        clientId: interview.clientId._id,
        candidateId: interview.candidateId._id,
        panelId: interview.panelId._id,
        dateTime: interview.dateTime,
      })
    }
  }

  isLoadingToggle = isLoading => {
    this.setState({
      isLoading
    })
  }

  onType = event => {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  reset = () => {
    this.setState({
      ...this.interview
    })

    editClose()
  }

  save = async event => {
    event.preventDefault()

    const { createOrUpdate, successCallback, messageShow } = this.props

    const { id, clientId, candidateId, panelId, dateTime } = this.state

    // Validate
    if(!isEmpty(clientId) && !isEmpty(candidateId) && !isEmpty(panelId)) {
      messageShow('Adding panel, please wait..')

      this.isLoadingToggle(true)

      // Create or Update
      try {
        const { data } = await createOrUpdate({ id, clientId, candidateId, panelId, dateTime: dateTime.format() })

        if(data.errors && !isEmpty(data.errors)) {
          messageShow(data.errors[0].message)
        } else {
          // Update panels list
          successCallback(false)

          // Reset form data
          this.reset()

          if(!isEmpty(id)) {
            messageShow('Interview updated successfully.')
          } else {
            messageShow('Interview added successfully.')
          }
        }
      } catch(error) {
        messageShow('There was some error. Please try again.')
      } finally {
        this.isLoadingToggle(false)
      }
    } else {
      messageShow('Please enter all the required information.')
    }
  }

  onDateSelect = (dateTime) => {
    this.setState({
      dateTime
    })
  }

  render() {
    const { classes, elevation, candidatesByClient, panelsByClient } = this.props
    const { isLoading, id, candidateId, panelId, dateTime } = this.state

    return (
      <Paper elevation={elevation} className={classes.formContainer}>
        <Typography
          variant={'subheading'}
          color={'inherit'}
        >
          { id === '' ? `Schedule an interview` : `Edit interview` }
        </Typography>

        <form onSubmit={this.save}>

          {/* Input - candidate */}
          <Grid item xs={12}>
            <FormControl
              style={{ marginTop: 10 }}
              fullWidth
              required={true}
            >
              <InputLabel htmlFor="candidate-id">Candidate</InputLabel>
              <Select
                value={nullToEmptyString(candidateId)}
                onChange={this.onType}
                inputProps={{
                  id: 'candidate-id',
                  name: 'candidateId',
                  required: 'required'
                }}
              >
                <MenuItem value="">
                  <em>Select client</em>
                </MenuItem>
                {
                  candidatesByClient.isLoading
                    ? <Loading />
                    : candidatesByClient.list && candidatesByClient.list.length > 0
                        ? candidatesByClient.list.map(candidate => (
                            <MenuItem key={candidate._id} value={candidate._id}>{ candidate.name }</MenuItem>
                          ))
                        : <MenuItem value="">
                            <em>No candidate added.</em>
                          </MenuItem>
                }
              </Select>
            </FormControl>
          </Grid>

          {/* Input - panel */}
          <Grid item xs={12}>
            <FormControl
              style={{ marginTop: 10 }}
              fullWidth
              required={true}
            >
              <InputLabel htmlFor="panel-id">Panel</InputLabel>
              <Select
                value={nullToEmptyString(panelId)}
                onChange={this.onType}
                inputProps={{
                  id: 'panel-id',
                  name: 'panelId',
                  required: 'required'
                }}
              >
                <MenuItem value="">
                  <em>Select client</em>
                </MenuItem>
                {
                  panelsByClient.isLoading
                    ? <Loading />
                    : panelsByClient.list && panelsByClient.list.length > 0
                        ? panelsByClient.list.map(panel => (
                            <MenuItem key={panel._id} value={panel._id}>{ panel.name }</MenuItem>
                          ))
                        : <MenuItem value="">
                            <em>No panel added.</em>
                          </MenuItem>
                }
              </Select>
            </FormControl>
          </Grid>

          {/* Input - dateTime */}
          <Grid item xs={12}>
            <Datetime
              onChange={this.onDateSelect}
              value={dateTime ? dateTime.format(`${ params.date.format.date } ${ params.date.format.time }`) : '' }
              dateFormat={params.date.format.date}
              timeFormat={params.date.format.time}
              renderInput={
                (props) => {
                  return (
                    <TextField
                      {...props}
                      label={'Date and time'}
                      placeholder={'Select date and time'}
                      margin={'normal'}
                      autoComplete={'off'}
                      fullWidth
                      inputProps={{ readOnly: true }}
                    />
                  );
                }
              }
            />
          </Grid>

          {/* Button -  Save */}
          <Grid item xs={12} className={classes.buttonsContainer}>
            <Tooltip title={'Cancel'} placement={'bottom'} enterDelay={500}>
              <Zoom in={id !== ''}>
                <IconButton
                  aria-label={'Cancel'}
                  onClick={this.reset}
                >
                  <IconClose />
                </IconButton>
              </Zoom>
            </Tooltip>

            <Tooltip title={'Save'} placement={'bottom'} enterDelay={500}>
              <IconButton
                type={'submit'}
                aria-label={'Save'}
                color={'primary'}
                disabled={isLoading}
              >
                <IconCheck />
              </IconButton>
            </Tooltip>
          </Grid>
        </form>
      </Paper>
    )
  }
}

// Component Properties
CreateOrEdit.propTypes = {
  elevation: PropTypes.number.isRequired,
  clientId: PropTypes.string.isRequired,
  successCallback: PropTypes.func.isRequired,
  classes: PropTypes.object.isRequired,
  interviewEdit: PropTypes.object.isRequired,
  candidatesByClient: PropTypes.object.isRequired,
  panelsByClient: PropTypes.object.isRequired,
  createOrUpdate: PropTypes.func.isRequired,
  editClose: PropTypes.func.isRequired,
  getCandidateListByClient: PropTypes.func.isRequired,
  getInterviewListByClient: PropTypes.func.isRequired,
  messageShow: PropTypes.func.isRequired
}
CreateOrEdit.defaultProps = {
  elevation: 1,
  clientShowLoading: true
}

// Component State
function createOrEditState(state) {
  return {
    interviewEdit: state.interviewEdit,
    candidatesByClient: state.candidatesByClient,
    panelsByClient: state.panelsByClient
  }
}

export default connect(createOrEditState, { createOrUpdate, editClose, getCandidateListByClient, getInterviewListByClient, messageShow })(withStyles(styles)(CreateOrEdit))
