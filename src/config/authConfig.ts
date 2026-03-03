import { getCurrentStage, getStageOrigin } from './stage';

const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;
const org = process.env.REACT_APP_AUTH0_ORG;

if (!domain) throw new Error('Missing REACT_APP_AUTH0_DOMAIN');
if (!clientId) throw new Error('Missing REACT_APP_AUTH0_CLIENT_ID');

const stageOrigin = getStageOrigin(getCurrentStage());

export const auth0Config = {
  domain,
  clientId,
  authorizationParams: {
    redirect_uri: stageOrigin,
    ...(audience ? { audience } : {}),
    ...(org ? { organization: org } : {}),
  },
};
