import React from 'react';
import { Navbar, NavDropdown, Nav, Modal, Button, Form, BlockQuote, Card } from 'react-bootstrap';
import GoogleMapReact from 'google-map-react';

const getDifference = (a, b) => Math.abs(a - b);

const findNearestPlace = (keyValueStore, selectedLat, selectedLng) => {
  let placeObject;
  let placeKey;
  let previousDistance;

  Object.keys(keyValueStore).forEach((key) => {
    const thisElement = keyValueStore[key];
    const currentLatitude = thisElement.pos.lat;
    const currentLongitude = thisElement.pos.lng;

    const x = getDifference(currentLatitude, selectedLat);
    const y = getDifference(currentLongitude, selectedLng);

    const x_squared = Math.pow(x, 2);
    const y_squared = Math.pow(y, 2);
    const d_squared = x_squared + y_squared;
    const currentDistance = Math.sqrt(d_squared);

    if (previousDistance == null || currentDistance < previousDistance) {
      placeObject = thisElement;
      placeKey = key;
      previousDistance = currentDistance;
    }
  });

  return [placeObject, placeKey];
};

const calculateRating = (placeObject) => {
  const stars = placeObject.reviews.map(review => review.stars);

  stars.sort((a, b) => a - b);

  let half = Math.floor(stars.length / 2);

  if (stars.length % 2) {
    return stars[half];
  }

  return ((stars[half-1] + stars[half]) / 2.0)
};

const Place = ({ text }) => (
  <div
    style={{
      color: 'red',
      fontSize: 16,
      fontWeight: 'bold',
      padding: 4,
      backgroundColor: 'green',
    }}
  >
    {text}
  </div>
);

class App extends React.Component {
  state = {
    showPlace: false,
    selectedPlace: [],
    selectedPlaceKey: '',
    showNewPlace: false,
    keyValueStore: {
      'Location 1': {
        name: 'Location 1',
        username: 'SimZor',
        description: 'Nice place much wow',
        pos: {
          lat: 59.342838,
          lng: 18.037861,
        },
        reviews: [
          {
            username: 'Test Person 2',
            text: 'Nice place',
            stars: 1,
          },
          {
            username: 'Test Person 1',
            text: 'Nice place much wow',
            stars: 3,
          },
        ],
      },
    },
    reviewText: '',
    reviewUsername: '',
    reviewStars: 0,
    newLocationUsername: '',
    newLocationName: '',
    newLocationDescription: '',
    newLocationLatitude: 0,
    newLocationLongitude: 0,
    showReviewForm: true,
  };

  static defaultProps = {
    center: {
      lat: 59.342838,
      lng: 18.037861,
    },
    zoom: 14,
  };

  handleSubmitReview = (event) => {
    event.preventDefault(); // Don't reload page

    this.setState({ showReviewForm: false });

    const {
      keyValueStore,
      reviewText,
      reviewUsername,
      reviewStars,
      selectedPlaceKey,
    } = this.state;

    keyValueStore[selectedPlaceKey].reviews.push({
      username: reviewUsername,
      stars: reviewStars,
      text: reviewText,
    });

    this.setState({ reviewText: '', reviewUsername: '', reviewStars: '' });
  };

  handleSubmitLocation = (event) => {
    event.preventDefault(); // Don't reload page

    const {
      keyValueStore,
      newLocationName,
      newLocationUsername,
      newLocationDescription,
      currentLatitude,
      currentLongitude,
    } = this.state;

    keyValueStore[newLocationName] = {
      name: newLocationName,
      username: newLocationUsername,
      description: newLocationDescription,
      reviews: [],
      pos: {
        lng: currentLongitude,
        lat: currentLatitude,
      },
    };

    this.setState({
      showNewPlace: false,
      newLocationName: '',
      newLocationUusername: '',
      newLocationDescription: '',
    });
  };

  onClick = ({x, y, lat, lng, event}) => {
    const { keyValueStore } = this.state;
    const fixedLat = parseFloat(lat).toFixed(6);
    const fixedLng = parseFloat(lng).toFixed(6);
    const nearestPlace = findNearestPlace(keyValueStore, lat, lng);

    this.setState({
      showReviewForm: true,
      currentLatitude: fixedLat,
      currentLongitude: fixedLng,
      showPlace: true,
      selectedPlace: nearestPlace,
      selectedPlaceKey: nearestPlace[1],
    });
  };

  handleChange = (event) => this.setState({ [event.target.id]: event.target.value });

  render = () => {
    const {
      showPlace,
      showNewPlace,
      selectedPlace,
      keyValueStore,
      reviewUsername,
      reviewStars,
      reviewText,
      newLocationUsername,
      newLocationName,
      newLocationDescription,
      showReviewForm,
    } = this.state;

    const placeObject = selectedPlace ? selectedPlace[0] : null;
    const placeObjectRating = placeObject ? calculateRating(placeObject) : 0;

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
          För att lägga till ett ställe, klicka på kartan där du vill lägga till stället. En popup kommer upp med närmaste restaurang, men om det inte redan finns en där du klickade så använder du knappen "Lägg till ett ställe på dessa koordinater".
        </div>
        <Navbar expand="lg" style={{ backgroundColor: '#e5393c', zIndex: 99 }}>
          <Navbar.Brand style={{ color: 'white' }}>
            Guide de T5
          </Navbar.Brand>
        </Navbar>
        <Modal show={showPlace} onHide={() => this.setState({ showPlace: false })}>
          <Modal.Header closeButton>
            <Modal.Title style={{ fontSize: 18 }}>
              {`Närmaste ställe där du klickade: ${selectedPlace[1]}`}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Button
              variant="primary"
              type="button"
              style={{
                width: '100%',
                backgroundColor: 'transparent',
                border: '1px solid red',
                color: 'red'
              }}
              onClick={() => this.setState({ showNewPlace: true, showPlace: false })}
            >
              Lägg till ett ställe på dessa koordinater
            </Button>
            <hr />
            <h6 style={{ lineHeight: 2 }}>
              {`${selectedPlace[1]}`}
            </h6>
            { placeObject ? (
                <ul style={{ listStyleType: 'none', marginLeft: 0, paddingLeft: 0 }}>
                  <li>{`Skapad av ${placeObject.username}`}</li>
                  <li>
                    Betyg&nbsp;
                    {
                      [1, 2, 3, 4, 5].map((currentStar, idx) => {
                        if (currentStar <= placeObjectRating) {
                          return <span key={idx.toString()}>&#9733;</span>;
                        } else {
                          return <span key={idx.toString()}>&#9734;</span>;
                        }
                      })
                    }
                  </li>
                </ul>
              ) : null
            }
            <p>
              {placeObject ? placeObject.description : null}
            </p>
            <hr />
            <h6 style={{ lineHeight: 2 }}>
              {`Lägg till omdöme för ${selectedPlace[1]}`}
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
            <h6 style={{ lineHeight: 2 }}>
              {`Omdömen för ${selectedPlace[1]}`}
            </h6>
            {
              placeObject
                ? (
                  selectedPlace[0].reviews.map((review, idx) => (
                    <Card style={{ marginBottom: 10 }} key={idx.toString()}>
                      <Card.Header>Omdöme</Card.Header>
                      <Card.Body>
                        <blockquote className="blockquote mb-0">
                          <p>
                            {review.text}
                          </p>
                          <div style={{ marginBottom: 10 }}>
                            {
                              [1, 2, 3, 4, 5].map((currentStar, idx) => {
                                if (currentStar <= review.stars) {
                                  return <span key={idx.toString()}>&#9733;</span>;
                                } else {
                                  return <span key={idx.toString()}>&#9734;</span>;
                                }
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
            defaultCenter={this.props.center}
            defaultZoom={this.props.zoom}
            onClick={this.onClick}
          >
            {
              Object.keys(keyValueStore).map(key => {
                const place = keyValueStore[key];

                return (
                  <Place
                    key={key}
                    lat={place.pos.lat}
                    lng={place.pos.lng}
                    text={key}
                  />
                );
              })
            }
          </GoogleMapReact>
        </div>
      </>
    );
  }
}

export default App;
