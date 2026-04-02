import axios from "axios";
import React, { useContext, useEffect,  useState } from "react";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import Card from "react-bootstrap/Card";
import CardImg from "react-bootstrap/CardImg";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";

function GetSpecial() {
  const [product, setProduct] = useState([]);
  const { state } = useContext(Store);
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await axios.get("/api/special", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setProduct(result.data);
        console.log(result.data);
      } catch (error) {
        toast.error(getError(error));
      }
    };
    fetchData();
  }, [userInfo]);
  return (
    <div>
      {product.map((product) => (
        <Card key={product._id}>
          <Card.Body>
            <CardImg
              src={product.image}
              className="card-img-top"
              alt={product.name}
            />
            <Row>
              <Col>
                <Card.Title>Izina:{product.name}</Card.Title>
                <Card.Title>Ubusobanuro:{product.description}</Card.Title>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}

export default GetSpecial;
