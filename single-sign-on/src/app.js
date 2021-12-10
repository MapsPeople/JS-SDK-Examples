import { AuthorizationRequest, AuthorizationNotifier, BaseTokenRequestHandler, RedirectRequestHandler, AuthorizationServiceConfiguration, FetchRequestor, TokenRequest, GRANT_TYPE_AUTHORIZATION_CODE } from "@openid/appauth";

const requestor = new FetchRequestor();
const authorizationNotifier = new AuthorizationNotifier();
const authorizationHandler = new RedirectRequestHandler();

mapsindoors.MapsIndoors.setLanguage('en');
mapsindoors.MapsIndoors.onAuthRequired = async ({ authClients = [], authIssuer = '' }) => {
    const config = await AuthorizationServiceConfiguration.fetchFromIssuer(authIssuer, requestor);
    if (window.location.hash.includes('code') && window.location.hash.includes('state')) {
        authorizationHandler.setAuthorizationNotifier(authorizationNotifier);
        authorizationNotifier.setAuthorizationListener(async (request, response, error) => {
            if (response) {
                const tokenHandler = new BaseTokenRequestHandler(requestor);
                const tokenRequest = new TokenRequest({
                    client_id: request.clientId,
                    redirect_uri: `${window.location.origin}${window.location.pathname}`,
                    grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
                    code: response.code,
                    extras: { code_verifier: request?.internal?.code_verifier }
                });

                tokenHandler.performTokenRequest(config, tokenRequest).then(response => {
                    mapsindoors.MapsIndoors.setAuthToken(response.accessToken);
                });
            }
        });

        await authorizationHandler.completeAuthorizationRequestIfPossible();
    } else {
        const authClient = authClients[0];
        const preferredIDP = authClient.preferredIDPs && authClient.preferredIDPs.length > 0 ? authClient.preferredIDPs[0] : '';
        const request = new AuthorizationRequest({
            client_id: authClient.clientId,
            redirect_uri: `${window.location.origin}${window.location.pathname}`,
            scope: 'openid profile account client-apis',
            response_type: AuthorizationRequest.RESPONSE_TYPE_CODE,
            extras: { 'acr_values': `idp:${preferredIDP}`, 'response_mode': 'fragment' }
        });

        authorizationHandler.performAuthorizationRequest(config, request);
    }
    history.replaceState(null, '', `${window.location.origin}${window.location.pathname}${window.location.search}`);
};

mapsindoors.MapsIndoors.setMapsIndoorsApiKey('b4db02059ef346808ca31711');

/*A new instance of google map is created. */
const mapView = new mapsindoors.mapView.GoogleMapsView({
    element: document.getElementById('map'),
    center: { lat: 57.0588552, lng: 9.9468377 },
    zoom: 18,
    maxZoom: 21
});

//Then the MapsIndoors SDK is initialized
const mi = new mapsindoors.MapsIndoors({
    mapView: mapView,
    floor: "1",
    labelOptions: {
        pixelOffset: { width: 0, height: 14 }
    }
});

/* We can now change the map view to show the default venue or pass in a venue id to go to another venue. */
mi.setVenue('b8b2bd0c78f04a249ea83249');
mi.fitVenue();

const googleMap = mapView.getMap();
const floorSelector = document.createElement('div');
console.log(floorSelector);
new mapsindoors.FloorSelector(floorSelector, mi);
googleMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(floorSelector);