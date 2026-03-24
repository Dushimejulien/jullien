import axios from "axios";
import React, { useContext, useEffect,  useState } from "react";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import { Container, Row, Col, Card, Image, Spinner, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";

function GetSpecial() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/special", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setRequests(data);
      } catch (error) {
        toast.error(getError(error));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo]);

  return (
    <Container className="py-5">
      <Helmet>
        <title>Special Requests - Admin</title>
      </Helmet>
      
      <div className="mb-5">
        <h1 className="text-gradient mb-1">Incoming Commissions</h1>
        <p className="text-muted small uppercase ls-wide fw-bold">Manual Product Procurement Requests ({requests.length})</p>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : (
        <Row className="gy-4">
          {requests.map((request) => (
            <Col key={request._id} md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm bg-card rounded-xl overflow-hidden product-card">
                 <div className="position-relative overflow-hidden" style={{ height: '240px' }}>
                    <Image
                      src={request.image}
                      className="w-100 h-100 object-fit-cover"
                      alt={request.name}
                    />
                    <Badge bg="primary" className="position-absolute top-3 right-3 rounded-pill px-3 py-2 shadow-sm">
                      New Request
                    </Badge>
                 </div>
                 <Card.Body className="p-4">
                    <Card.Title className="fw-bold fs-5 mb-2">{request.name}</Card.Title>
                    <div className="text-muted small mb-3" style={{ height: '4.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                       {request.description}
                    </div>
                    <hr className="my-3 opacity-10" />
                    <div className="d-flex justify-content-between align-items-center">
                       <span className="text-muted small italic">Source: Customer Request</span>
                       <Badge bg="light" text="dark" className="border fw-normal">Procurement pending</Badge>
                    </div>
                 </Card.Body>
              </Card>
            </Col>
          ))}
          {requests.length === 0 && (
            <Col xs={12} className="text-center py-5">
               <div className="mb-3 text-muted opacity-25"><i className="fas fa-clipboard-list fs-1"></i></div>
               <h4 className="text-muted">No active special requests found.</h4>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
}

export default GetSpecial;
