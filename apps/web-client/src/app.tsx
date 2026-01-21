import React from 'react';
import './App.css';
import SuperTokens, { SuperTokensWrapper } from 'supertokens-auth-react';
import { AppRoutes } from './routes';
import { getSupertokensConfig } from './config';
import { BrowserRouter, Router } from 'react-router-dom';

SuperTokens.init(getSupertokensConfig())

function App() {
  return (
    <SuperTokensWrapper>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SuperTokensWrapper>
  );
}

export default App;
