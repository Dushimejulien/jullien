import React, { useContext, useEffect, useReducer } from "react";
import LoadingBox from "../components/LoadingBox";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Product from "../components/products";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { Navigate, useNavigate } from "react-router-dom";
import { getError } from "../utils";
import Button from "react-bootstrap/Button";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };

    case "FETCH_SUCCESS":
      return { ...state, products: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function HomeScreen() {
  const navigate = useNavigate();
  const [{ loading, error, products }, dispatch] = useReducer(reducer, {
    products: [],
    loading: true,
    error: "",
  });
  const { state } = useContext(Store);
  const { userInfo } = state;
  //const [products, setProducts] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get("/api/products");
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
      } catch (error) {
        dispatch({ type: "FETCH_FAIL", payload: error.message });
      }

      //setProducts(result.data);
    };
    fetchData();
  }, []);

  const createHandler = async () => {
    if (window.confirm("Are you sure to create?")) {
      try {
        dispatch({ type: "CREATE_REQUEST" });
        const { data } = await axios.post(
          "/api/products",
          {},
          {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }
        );
        toast.success("product created successfully");
        dispatch({ type: "CREATE_SUCCESS" });
        Navigate(`/admin/product/${data.product}`);
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: "CREATE_FAIL",
        });
      }
    }
  };
  if (userInfo && userInfo.isAdmin) {
    return (
      <div>
        <Helmet>
          <title>jullien</title>
        </Helmet>
        <h1>Ibicuruzwa mububiko</h1>

        <Row style={{ left: "0" }}>
          <Col className="col text-end">
            <div>
              <Button type="button" onClick={createHandler}>
                Create Product
              </Button>
            </div>
          </Col>

          <Col className="col text-end">
            <div>
              <Button
                type="button"
                onClick={() => {
                  navigate(`/admin/create`);
                }}
              >
                Add expense
              </Button>
            </div>
          </Col>
        </Row>

        <div className="products">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <Row>
              {products.map &&
                products.map((product) => (
                  <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                    <Product product={product}></Product>
                  </Col>
                ))}
            </Row>
          )}
        </div>
      </div>
    );
  } else if (userInfo && userInfo.isSeller) {
    return (
      <div>
        <Helmet>
          <title>jullien</title>
        </Helmet>
        <h1>Ibicuruzwa mububiko</h1>

        <Row style={{ left: "0" }}>
          <Col className="col text-end">
            <div>
              <Button
                type="button"
                onClick={() => {
                  navigate(`/admin/create`);
                }}
              >
                Add expense
              </Button>
            </div>
          </Col>
        </Row>

        <div className="products">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <Row>
              {products.map &&
                products.map((product) => (
                  <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                    <Product product={product}></Product>
                  </Col>
                ))}
            </Row>
          )}
        </div>
      </div>
    );
  } else {
    return (
      <div>
        <Helmet>
          <title>jullien</title>
        </Helmet>
        <h1>Ibicuruzwa mububiko</h1>
        <Button type="button" onClick={() => navigate("/special")}>
          Tanga komande ku bicuruzwa wabuze mu bubiko
        </Button>

        <div className="products">
          {loading ? (
            <LoadingBox />
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <Row>
              {products.map &&
                products.map((product) => (
                  <Col key={product.slug} sm={6} md={4} lg={3} className="mb-3">
                    <Product product={product}></Product>
                  </Col>
                ))}
            </Row>
          )}
        </div>
      </div>
    );
  }
}

export default HomeScreen;
