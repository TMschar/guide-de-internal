import React from 'react';
import {
  Navbar,
  Modal,
  Button,
  Form,
  Card,
} from 'react-bootstrap';
import GoogleMapReact from 'google-map-react';
import {
  getAllLocations,
  addLocation,
  addLocationReview,
} from './api/lambda';

const getDifference = (a, b) => Math.abs(a - b);

const findNearestLocation = (locations, selectedLat, selectedLng) => {
  let locationObject;
  let previousDistance;

  locations.forEach((location) => {
    const currentLatitude = location.pos.lat;
    const currentLongitude = location.pos.lng;

    const x = getDifference(currentLatitude, selectedLat);
    const y = getDifference(currentLongitude, selectedLng);

    const xSquared = x ** 2;
    const ySquared = y ** 2;
    const dSquared = xSquared + ySquared;
    const currentDistance = Math.sqrt(dSquared);

    if (previousDistance == null || currentDistance < previousDistance) {
      locationObject = location;
      previousDistance = currentDistance;
    }
  });

  return locationObject;
};

const calculateRating = (placeObject) => {
  const stars = placeObject.reviews.map((review) => review.stars);

  stars.sort((a, b) => a - b);

  const half = Math.floor(stars.length / 2);

  if (stars.length % 2) {
    return stars[half];
  }

  return ((stars[half - 1] + stars[half]) / 2.0);
};

const Place = ({ text }) => (
  <div
    style={{
      color: 'red',
      fontSize: 16,
      borderLeft: 'solid 1px green',
    }}
  >
    {text}
  </div>
);

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showPlace: false,
      selectedLocation: null,
      showNewPlace: false,
      locations: [],
      reviewText: '',
      reviewUsername: '',
      reviewStars: 0,
      newLocationUsername: '',
      newLocationName: '',
      newLocationDescription: '',
      showReviewForm: true,
    };
  }

  handleSubmitReview = async (event) => {
    event.preventDefault(); // Don't reload page

    this.setState({ showReviewForm: false });

    const {
      selectedLocation,
      reviewText,
      reviewUsername,
      reviewStars,
    } = this.state;

    selectedLocation.reviews.push({
      username: reviewUsername,
      stars: reviewStars,
      text: reviewText,
    });

    const response = await addLocationReview(
      selectedLocation.location_id,
      reviewUsername,
      reviewText,
      reviewStars,
    );
    console.log(await response.json());

    this.setState({
      reviewText: '',
      reviewUsername: '',
      reviewStars: '',
    });
  };

  handleSubmitLocation = async (event) => {
    event.preventDefault(); // Don't reload page

    const {
      locations,
      newLocationName,
      newLocationUsername,
      newLocationDescription,
      currentLatitude,
      currentLongitude,
    } = this.state;

    const newLocation = {
      location_id: newLocationName,
      username: newLocationUsername,
      description: newLocationDescription,
      reviews: [],
      pos: {
        lng: currentLongitude,
        lat: currentLatitude,
      },
    };

    locations.push(newLocation);

    const response = await addLocation(
      newLocationName,
      newLocationDescription,
      newLocationUsername,
      currentLongitude,
      currentLatitude,
    );
    console.log(await response.json());

    this.setState({
      showNewPlace: false,
      newLocationName: '',
      newLocationUsername: '',
      newLocationDescription: '',
    });
  };

  onClick = ({ lat, lng }) => {
    const { locations } = this.state;
    const fixedLat = parseFloat(lat).toFixed(6);
    const fixedLng = parseFloat(lng).toFixed(6);
    const nearestLocation = findNearestLocation(locations, lat, lng);

    this.setState({
      showReviewForm: true,
      currentLatitude: fixedLat,
      currentLongitude: fixedLng,
      showPlace: true,
      selectedLocation: nearestLocation,
    });
  };

  handleChange = (event) => this.setState({ [event.target.id]: event.target.value });

  componentDidMount = async () => {
    try {
      const response = await getAllLocations();
      const result = await response.json();

      const locations = result.Items;
      this.setState({ locations });
    } catch {};
  }

  render = () => {
    const {
      showPlace,
      showNewPlace,
      selectedLocation,
      reviewUsername,
      reviewStars,
      reviewText,
      newLocationUsername,
      newLocationName,
      newLocationDescription,
      showReviewForm,
      locations,
    } = this.state;

    const {
      center,
      zoom,
    } = this.props;

    const selectedLocationRating = selectedLocation ? calculateRating(selectedLocation) : 0;

    return (
      <>
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            maxWidth: '80%',
            maxHeight: '40%',
            backgroundColor: '#3a3a3a',
            color: 'white',
            padding: 10,
            fontSize: 10,
          }}
        >
          För att lägga till ett ställe, klicka på kartan där du vill lägga till stället.
          En popup kommer upp med närmaste restaurang, men om det inte redan finns en där
          du klickade så använder du knappen &quot;Lägg till ett ställe på dessa koordinater&quot;.
        </div>
        <Navbar expand="lg" style={{ backgroundColor: '#e5393c', zIndex: 99 }}>
          <Navbar.Brand style={{ color: 'white' }}>
            Guide de T5
          </Navbar.Brand>
        </Navbar>
        <Modal show={showPlace} onHide={() => this.setState({ showPlace: false })}>
          <Modal.Header closeButton>
            {
              selectedLocation ? (
                <Modal.Title style={{ fontSize: 18 }}>
                  {`Närmaste ställe där du klickade: ${selectedLocation.location_id}`}
                </Modal.Title>
              ) : null
            }
          </Modal.Header>
          <Modal.Body>
            <Button
              variant="primary"
              type="button"
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid red',
                color: 'red',
              }}
              onClick={() => this.setState({ showNewPlace: true, showPlace: false })}
            >
              Lägg till ett ställe på dessa koordinater
            </Button>
            <hr />
            {
              selectedLocation ? (
                <h6 style={{ lineHeight: 2 }}>
                  {`${selectedLocation.location_id}`}
                </h6>
              ) : null
            }
            {
              selectedLocation ? (
                <ul style={{ listStyleType: 'none', marginLeft: 0, paddingLeft: 0 }}>
                  <li>{`Skapad av ${selectedLocation.username}`}</li>
                  <li>
                    Betyg&nbsp;
                    {
                      [1, 2, 3, 4, 5].map((currentStar, idx) => {
                        if (currentStar <= selectedLocationRating) {
                          return <span key={idx.toString()}>&#9733;</span>;
                        }
                        return <span key={idx.toString()}>&#9734;</span>;
                      })
                    }
                  </li>
                </ul>
              ) : null
            }
            <p>
              {selectedLocation ? selectedLocation.description : null}
            </p>
            <hr />
            <h6 style={{ lineHeight: 2 }}>
              {`Lägg till omdöme för ${selectedLocation}`}
            </h6>
            {
              showReviewForm ? (
                <Form style={{ marginBottom: 20 }} onSubmit={this.handleSubmitReview}>
                  <Form.Group>
                    <Form.Control
                      type="text"
                      placeholder="Användarnamn"
                      value={reviewUsername}
                      onChange={this.handleChange}
                      id="reviewUsername"
                    />
                    <Form.Text className="text-muted">
                      Används för att veta vem som skrivit omdömet
                    </Form.Text>
                  </Form.Group>
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows="3"
                      placeholder="Ditt omdöme"
                      value={reviewText}
                      id="reviewText"
                      onChange={this.handleChange}
                    />
                  </Form.Group>
                  <Form.Group>
                    <Form.Control
                      type="number"
                      placeholder="Antal sjärnor"
                      value={reviewStars}
                      id="reviewStars"
                      onChange={this.handleChange}
                    />
                    <Form.Text className="text-muted">
                      Mellan 1 och 5
                    </Form.Text>
                  </Form.Group>
                  <Button
                    style={{
                      backgroundColor: 'red',
                      border: 'none',
                      color: 'white',
                    }}
                    variant="primary"
                    type="submit"
                  >
                    Lägg till omdöme
                  </Button>
                </Form>
              ) : <div>Omdöme tillagt</div>
            }
            <hr />
            {
              selectedLocation ? (
                <h6 style={{ lineHeight: 2 }}>
                  {`Omdömen för ${selectedLocation.location_id}`}
                </h6>
              ) : null
            }
            {
              selectedLocation
                ? (
                  selectedLocation.reviews.map((review, idx) => (
                    <Card style={{ marginBottom: 10 }} key={idx.toString()}>
                      <Card.Header>Omdöme</Card.Header>
                      <Card.Body>
                        <blockquote className="blockquote mb-0">
                          <p>
                            {review.text}
                          </p>
                          <div style={{ marginBottom: 10 }}>
                            {
                              [1, 2, 3, 4, 5].map((currentStar, starIdx) => {
                                if (currentStar <= review.stars) {
                                  return <span key={starIdx.toString()}>&#9733;</span>;
                                }

                                return <span key={starIdx.toString()}>&#9734;</span>;
                              })
                            }
                          </div>
                          <footer className="blockquote-footer">
                            {review.username}
                          </footer>
                        </blockquote>
                      </Card.Body>
                    </Card>
                  ))
                )
                : null
            }
          </Modal.Body>
        </Modal>
        <Modal show={showNewPlace} onHide={() => this.setState({ showNewPlace: false })}>
          <Modal.Header closeButton>
            <Modal.Title>Lägg till ny plats</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={this.handleSubmitLocation}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Användarnamn"
                  onChange={this.handleChange}
                  value={newLocationUsername}
                  id="newLocationUsername"
                />
                <Form.Text className="text-muted">
                  Används för att veta vem som skrivit omdömet
                </Form.Text>
              </Form.Group>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="Platsens eller restaurangens namn"
                  onChange={this.handleChange}
                  value={newLocationName}
                  id="newLocationName"
                />
              </Form.Group>
              <Form.Group>
                <Form.Control
                  as="textarea"
                  rows="3"
                  placeholder="Beskriv platsen / restaurangen"
                  onChange={this.handleChange}
                  value={newLocationDescription}
                  id="newLocationDescription"
                />
              </Form.Group>
              <Button
                variant="primary"
                type="submit"
                style={{
                  backgroundColor: 'red',
                  border: 'none',
                  color: 'white',
                }}
              >
                Lägg till plats
              </Button>
            </Form>
          </Modal.Body>
        </Modal>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100%',
            zIndex: -99,
          }}
        >
          <GoogleMapReact
            bootstrapURLKeys={{ key: 'AIzaSyDQFrXqYl2PUGGjB0avqnIouVPpO5Rq_TY' }}
            defaultCenter={center}
            defaultZoom={zoom}
            onClick={this.onClick}
          >
            {
              locations.map((location) => (
                <Place
                  key={location.location_id}
                  lat={location.pos.lat}
                  lng={location.pos.lng}
                  text={location.location_id}
                />
              ))
            }
          </GoogleMapReact>
        </div>
      </>
    );
  }
}

App.propTypes = {};

App.defaultProps = {
  center: {
    lat: 59.342838,
    lng: 18.037861,
  },
  zoom: 14,
};

export default App;
