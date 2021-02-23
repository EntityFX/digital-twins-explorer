// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import React, { Component } from "react";
import { DefaultButton, Spinner } from "office-ui-fabric-react";
import ModalComponent from "../ModalComponent/ModalComponent";
import { eventService } from "../../services/EventService";
import { CUSTOM_AUTH_ERROR_MESSAGE, CUSTOM_NOT_FOUND_ERROR_MESSAGE, CUSTOM_AZURE_ERROR_MESSAGE, AUTH_SUCCESS_MESSAGE, AUTH_CONFLICT_MESSAGE, AUTH_FORBIDDEN_MESSAGE, AUTH_NOT_FOUND_MESSAGE } from "../../services/Constants";
import { print } from "../../services/LoggingService";
import { rbacService} from "../../services/RBACService";

import "./ErrorMessage.scss";

export class ErrorMessageComponent extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      errorMessage: "",
      showFixAuth: false,
      showAuthSpinner: false,
      showAuthStatus: 0,
      showAuthResponse: false
    };
  }

  componentDidMount() {
    eventService.subscribeError(exc => {
      let message = "";
      let auth = "";
      if (exc && exc.name === "RestError" && exc.statusCode === 403) {
        message = CUSTOM_AUTH_ERROR_MESSAGE;
        auth = true;
      } else if (exc && exc.name === "RestError" && exc.statusCode === 404) {
        message = CUSTOM_NOT_FOUND_ERROR_MESSAGE;
      } else {
        message = exc.customMessage ? `${exc.customMessage}: ${exc}` : `${exc}`;
      }

      print(message, "error");

      this.setState({
        errorMessage: message,
        showModal: true,
        showFixAuth: auth
      });
    });
  }

  close = () => {
    this.setState({ showModal: false });
  }

  fixPermissions = async () => {
    this.setState(
      {showAuthSpinner: true,
        showFixAuth: false});
    const requestParams = await rbacService.addReaderRBAC();
    this.setState(
      {showAuthSpinner: false,
        showAuthResponse: true,
        showAuthStatus: requestParams});
  }

  render() {
    const { showModal, errorMessage, showFixAuth, showAuthSpinner, showAuthStatus, showAuthResponse} = this.state;
    let authComponent = "";
    if (showFixAuth) {
      authComponent = <DefaultButton className="modal-button close-button" onClick={this.fixPermissions} style={{width: 150}}>Assign yourself data reader access</DefaultButton>;
    } else if (showAuthSpinner) {
      authComponent = <Spinner />;
    } else if (showAuthResponse && showAuthStatus === false){
      authComponent = <p style={{margin: 7}}>{CUSTOM_AZURE_ERROR_MESSAGE}</p>
    } else if (showAuthResponse && showAuthStatus !== 0) {
      authComponent = <p style={{margin: 7}}>{AUTH_NOT_FOUND_MESSAGE}</p>;
      for (const response of showAuthStatus) {
        if (response) {
          switch (response.status) {
            case 201:
              authComponent = <p style={{color: "green", "textAlign": "left", width: 400, margin: 0}}>{AUTH_SUCCESS_MESSAGE}</p>;
              break;
            case 403:
              authComponent = <p style={{margin: 7}}>{AUTH_FORBIDDEN_MESSAGE}</p>;
              break;
            case 409:
              authComponent = <p style={{margin: 7}}>{AUTH_CONFLICT_MESSAGE}</p>;
              break;
            default:
              authComponent = <p>{response.statusText}</p>;
          }
        }
      }
    }
    return (
      <ModalComponent
        isVisible={showModal}
        className="error-message">
        <div className="message-container">
          <h2 className="heading-2">Error</h2>
          <p>{errorMessage}</p>
          <div className="btn-group">
            <DefaultButton className="modal-button close-button" onClick={this.close}>Close</DefaultButton>
            {authComponent}
          </div>
        </div>
      </ModalComponent>
    );
  }

}
