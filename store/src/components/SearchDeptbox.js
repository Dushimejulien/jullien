import axios from 'axios';
import React, { useContext, useEffect, useReducer, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  FormControl,
  InputGroup,
  ListGroup,
  Row,
} from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getError } from '../utils';
import { Store } from '../Store';
import MessageBox from './MessageBox';

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_REQUEST':
      return { ...state, loading: true, error: '' };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, report: action.payload, error: '' };
    case 'FETCH_FAIL':
      return { ...state, loading: false, error: action.payload };

    case 'UPDATE_REQUEST':
      return { ...state, loadingUpdate: true };
    case 'UPDATE_SUCCESS':
      return { ...state, loadingUpdate: false };
    case 'UPDATE_FAIL':
      return { ...state, loadingUpdate: false };

    default:
      return state;
  }
}

function SearchDeptbox() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const params = useParams();
  const { id: reportId } = params;
  const navigate = useNavigate();

  const [{ report }, dispatch] = useReducer(reducer, {
    loading: true,
    report: {},
    error: '',
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        dispatch({ type: 'FETCH_REQUEST' });
        const { data } = await axios.get(`/api/report/${reportId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });

        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        dispatch({ type: 'FETCH_FAIL', payload: getError(error) });
      }
    };
    if (!userInfo) {
      return navigate('/login');
    }
    if (!report._id || (report._id && report._id !== reportId)) {
      fetchReport();
    }
  }, [report, navigate, userInfo, reportId]);

  const navigateButton = () => {
    navigate('/admin/report');
  };

  // const submitHandler = async (e, reportId) => {
  //   e.preventDefault();
  //   try {
  //     dispatch({ type: 'UPDATE_REQUEST' });
  //     await axios.put(
  //       `/api/report/${reportId}`,
  //       {
  //         ...report,
  //       },
  //       {
  //         headers: { Authorization: `Bearer ${userInfo.token}` },
  //       }
  //     );
  //     dispatch({ type: 'UPDATE_SUCCESS' });
  //     toast.success('Debts paid');
  //     navigate('/admin/report');
  //   } catch (err) {
  //     toast.error(getError(err));
  //     dispatch({ type: 'UPDATE_FAIL' });
  //   }
  // };

  const [searchResult, setSearchResult] = useState([]);
  const [key, setKey] = useState('');

  useEffect(() => {
    const search = async () => {
      try {
        if (!key.trim()) {
          setSearchResult([]);
          return;
        }
        const res = await axios.get('/api/report/search', {
          params: { key: key },
        });
        setSearchResult(res.data.data);
      } catch (error) {
        console.log(error);
      }
    };
    search();
  }, [key]);

  return (
    <Form className="d-flex me-auto">
      <InputGroup>
        <FormControl
          type="text"
          name="q"
          id="q"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Search debts"
          aria-label="Search debts"
          aria-describedby="button-search"
        />
        <Button variant="outline-primary" type="submit" id="button-search">
          <i className="fas fa-search"></i>
        </Button>
      </InputGroup>
      <div>
        {searchResult.map((result) => (
          <Row key={result._id}>
            <Col md={8}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Report</Card.Title>
                  <Card.Text>
                    <strong>Debts:</strong> {result.depts}
                  </Card.Text>
                  <Card.Text>
                    <strong>Losses:</strong> {result.ibyangiritse}
                  </Card.Text>
                  <Card.Text>
                    <strong>Sold at:</strong> {result.soldAt}
                  </Card.Text>
                  <Card.Text>
                    <strong>Comments:</strong> {result.comments}
                  </Card.Text>
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Payments</Card.Title>
                  <Card.Text>
                    <strong>Method: </strong> {result.paymentMethod}
                  </Card.Text>
                  {result.paymentMethod === 'Cash' ||
                  result.paymentMethod === 'MoMo' ? (
                    <h4 style={{ color: 'green' }}>Paid</h4>
                  ) : (
                    <MessageBox variant="danger">Not Paid</MessageBox>
                  )}
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Items</Card.Title>
                  <ListGroup variant="flush">
                    {result.reportItems &&
                      result.reportItems.map((item) => (
                        <ListGroup.Item key={item._id}>
                          <Row className="align-item-center">
                            <Col md={6}>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="img-fluid rounded img-thumbnail"
                              />
                              <Link to={`/product/${item.slug}`}>
                                {item.name}
                              </Link>
                            </Col>
                            <Col md={2}>
                              <span>{item.quantity}</span>
                            </Col>
                            <Col md={2}>{item.price} RWF</Col>
                            <Col md={2}>{item.costPrice} RWF</Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>Report Summary</Card.Title>
                  <ListGroup variant="flush">
                    <Row>
                      <Col>Sales</Col>
                      <Col>{result.sales} RWF</Col>
                    </Row>
                    <Row>
                      <Col>
                        <strong>Total costs:</strong>
                      </Col>
                      <Col>
                        <strong>{result.costs} RWF</strong>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <strong>Tax:</strong>
                      </Col>
                      <Col>
                        <strong>{result.taxPrice} RWF</strong>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <strong>Gross profit:</strong>
                      </Col>
                      <Col>
                        <strong>{result.grossProfit} RWF</strong>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <strong>Net profit:</strong>
                      </Col>
                      <Col>
                        <strong>{result.netProfit} RWF</strong>
                      </Col>
                    </Row>
                  </ListGroup>
                </Card.Body>
              </Card>
              {result.depts > 0 && (
                <Button
                  onClick={() => navigate(`/report/${result._id}`)}
                  style={{ marginRight: '5rem' }}
                  type="button"
                >
                  Paid
                </Button>
              )}
              <Button type="button" onClick={navigateButton}>
                Back
              </Button>
            </Col>
          </Row>
        ))}
      </div>
    </Form>
  );
}

export default SearchDeptbox;
