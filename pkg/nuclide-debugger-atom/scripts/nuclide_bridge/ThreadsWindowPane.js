'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import NuclideBridge from './NuclideBridge';
import React from 'react';
import ReactDOM from 'react-dom';

const WebInspector: typeof WebInspector = window.WebInspector;

type StateType = {
  threadData: ?ThreadData;
};

class ThreadsWindowComponent extends React.Component<void, mixed, StateType> {
  props: mixed;
  state: StateType;

  constructor(props: mixed) {
    super(props);
    this._registerUpdate();
    this.state = this._getState();
    (this: any)._handleThreadsUpdated = this._handleThreadsUpdated.bind(this);
  }

  componentWillUnmount() {
    this._unregisterUpdate();
  }

  _handleThreadsUpdated(event: WebInspector.Event): void {
    this.setState(this._getState());
  }

  _getState(): StateType {
    let threadData = null;
    const mainTarget = WebInspector.targetManager.mainTarget();
    if (mainTarget != null) {
      threadData = mainTarget.debuggerModel.threadStore.getData();
    }
    return {threadData};
  }

  _registerUpdate(): void {
    WebInspector.targetManager.addModelListener(
      WebInspector.DebuggerModel,
      WebInspector.DebuggerModel.Events.ThreadsUpdated,
      this._handleThreadsUpdated,
      this,
    );
    WebInspector.targetManager.addModelListener(
      WebInspector.DebuggerModel,
      WebInspector.DebuggerModel.Events.SelectedThreadChanged,
      this._handleThreadsUpdated,
      this,
    );
  }

  _unregisterUpdate(): void {
    WebInspector.targetManager.removeModelListener(
      WebInspector.DebuggerModel,
      WebInspector.DebuggerModel.Events.ThreadsUpdated,
      this._handleThreadsUpdated,
      this,
    );
    WebInspector.targetManager.removeModelListener(
      WebInspector.DebuggerModel,
      WebInspector.DebuggerModel.Events.SelectedThreadChanged,
      this._handleThreadsUpdated,
      this,
    );
  }

  _handleDoubleClick(thread: Object): void {
    NuclideBridge.selectThread(thread.id);
  }

  /**
   * '>' means the stopped thread.
   * '*' means the current selected thread.
   * Empty space for other threads.
   */
  _getIndicator(thread: Object, stopThreadId: number, selectedThreadId: number): string {
    return thread.id === stopThreadId ? '>' : (thread.id === selectedThreadId ? '*' : ' ');
  }

  render() {
    const children = [];
    const {threadData} = this.state;
    if (threadData && threadData.threadMap) {
      for (const thread of threadData.threadMap.values()) {
        const indicator = this._getIndicator(
          thread,
          threadData.stopThreadId,
          threadData.selectedThreadId
        );
        children.push((
          <tr align="center" onDoubleClick={this._handleDoubleClick.bind(this, thread)}>
            <td>{indicator}</td>
            <td>{thread.id}</td>
            <td>{thread.description}</td>
            <td>{thread.location.scriptId}</td>
          </tr>
        ));
      }
    }

    const containerStyle = {
      maxHeight: '20em',
      overflow: 'auto',
    };
    return (
      <div style={containerStyle}>
        <table width="100%">
          <thead>
            <tr key={0} align="center">
              <td> </td>
              <td>ID</td>
              <td>Description</td>
              <td>Location</td>
            </tr>
          </thead>
          <tbody align="center">
            {children}
          </tbody>
        </table>
      </div>
    );
  }
}

class ThreadsWindowPane extends WebInspector.SidebarPane {
  constructor() {
    // WebInspector classes are not es6 classes, but babel forces a super call.
    super();
    // Actual super call.
    WebInspector.SidebarPane.call(this, 'Threads');

    // TODO: change.
    this.registerRequiredCSS('components/breakpointsList.css');

    ReactDOM.render(
      <ThreadsWindowComponent />,
      this.bodyElement);

    this.expand();
  }

  // This is implemented by various UI views, but is not declared anywhere as
  // an official interface. There's callers to various `reset` functions, so
  // it's probably safer to have this.
  reset() {
  }
}

module.exports = ThreadsWindowPane;