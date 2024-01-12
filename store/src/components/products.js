import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Rating from "./Rating";
import axios from "axios";
import { useContext, useEffect, useReducer, useState } from "react";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import Form from "react-bootstrap/Form";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        products: action.payload.products,
        page: action.payload.page,
        pages: action.payload.pages,
        loading: false,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };

    case "CREATE_REQUEST":
      return { ...state, loadingCreate: true };
    case "CREATE_SUCCESS":
      return {
        ...state,
        loadingCreate: false,
      };
    case "CREATE_FAIL":
      return { ...state, loadingCreate: false };
    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };

    default:
      return state;
  }
};

function Product(props) {
  const [, setName] = useState("");
  const [, setSlug] = useState("");
  const [, setPrice] = useState("");
  const [, setImage] = useState("");
  const [, setCostPrice] = useState("");
  const [, setCategory] = useState("");
  const [, setBrand] = useState("");
  const [, setDescription] = useState("");
  const { product } = props;
  const [countInStock, setCountInStock] = useState(product.countInStock);

  const [{ error, successDelete }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const {
    userInfo,
    cart: { cartItems },
  } = state;

  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const page = sp.get("page") || 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`/api/products/admin?page=${page} `, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {}
    };

    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    } else {
      fetchData();
    }
  }, [page, userInfo, successDelete]);

  const deleteHandler = async (product) => {
    if (window.confirm("Are you sure to delete?")) {
      try {
        await axios.delete(`/api/products/${product._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("product deleted successfully");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(error));
        dispatch({
          type: "DELETE_FAIL",
        });
      }
    }
  };

  const addToCartHandler = async (item) => {
    const existItem = cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert("Sorry. Product is out of stock");
    }
    if (quantity > 0) {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.patch(`/api/products/${product._id}`, {
        name: setName(product.name),
        slug: setSlug(product.slug),
        price: setPrice(product.price),
        costPrice: setCostPrice(product.costPrice),
        image: setImage(product.image),
        category: setCategory(product.category),
        brand: setBrand(product.brand),
        countInStock: setCountInStock(product.countInStock - quantity),
        description: setDescription(product.description),
      });
      dispatch({
        type: "UPDATE_SUCCESS",
      });
      toast.success("Product updated successfully");
    }
    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...item, quantity },
    });
  };
  const cardStyle = {
    maxWidth: '18rem',
    marginBottom: '20px',
    border: '1px solid #e5e5e5',
    borderRadius: '10px',
  };

  const imageStyle = {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '10px 10px 0 0',
  };
  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.patch(`/api/products/${product._id}`, {
        name: setName(product.name),
        slug: setSlug(product.slug),
        price: setPrice(product.price),
        costPrice: setCostPrice(product.costPrice),
        image: setImage(product.image),
        category: setCategory(product.category),
        brand: setBrand(product.brand),
        countInStock,
        description: setDescription(product.description),
      });
      dispatch({
        type: "UPDATE_SUCCESS",
      });
      toast.success("Product updated successfully");
      navigate("/");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  if (userInfo && userInfo.isAdmin) {
    return (
      <div>
        <Card style={cardStyle}>
          <Link to={`/product/${product.slug}`}>
            <img
              src={product.image}
              className="card-img-top"
              alt={product.name}
            />
          </Link>
          <Card.Body>
            <Link to={`/product/${product.slug}`}>
              <Card.Title>{product.name}</Card.Title>
            </Link>
            <Card.Text>{product.price} RWF</Card.Text>
            <Card.Text>{product.countInStock}</Card.Text>

            {product.countInStock === 0 ? (
              <Button variant="light" disabled>
                Byashize mububiko
              </Button>
            ) : (
              <Button onClick={() => addToCartHandler(product)}>Add</Button>
            )}

            <>
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-3" controlId="image">
                  <Form.Label>Image File</Form.Label>
                  <Form.Control
                    value={countInStock}
                    onChange={(e) => setCountInStock(e.target.value)}
                    required
                  />
                </Form.Group>
                <Button type="submit">sell</Button>
              </Form>

              <Button
                type="button"
                variant="light"
                onClick={() => navigate(`/admin/product/${product._id}`)}
              >
                Edit
              </Button>

              <Button
                type="button"
                variant="light"
                onClick={() => deleteHandler(product)}
              >
                Delete
              </Button>
            </>

            <Rating rating={product.rating} numReviews={product.numReviews} />
          </Card.Body>
        </Card>
      </div>
    );
  } else if (userInfo && userInfo.isASeller) {
    return (
      <div>
        <Card style={cardStyle}>
          <Link to={`/product/${product.slug}`}>
            <img
              src={product.image}
              className="card-img-top"
              alt={product.name}
              style={imageStyle}
            />
          </Link>
          <Card.Body>
            <Link to={`/product/${product.slug}`}>
              <Card.Title>{product.name}</Card.Title>
            </Link>
            <Card.Text>{product.price} RWF</Card.Text>

            {product.countInStock === 0 ? (
              <Button variant="light" disabled>
                Byashize mububiko
              </Button>
            ) : (
              <Button onClick={() => addToCartHandler(product)}>Add</Button>
            )}

            <>
              <Form onSubmit={submitHandler}>
                <Button className="mt-3" type="submit">
                  sell
                </Button>
              </Form>
            </>

            <Rating rating={product.rating} numReviews={product.numReviews} />
          </Card.Body>
        </Card>
      </div>
    );
  } else if (userInfo && (!userInfo.isAdmin || !userInfo.suAdmin)) {
    return (
      <div>
        <Card style={cardStyle}>
          <Link to={`/product/${product.slug}`}>
            <img
              src={product.image}
              className="card-img-top"
              alt={product.name}
              style={imageStyle}
            />
          </Link>
          <Card.Body>
            <Link to={`/product/${product.slug}`}>
              <Card.Title>{product.name}</Card.Title>
            </Link>
            <Card.Text>{product.price} RWF</Card.Text>

            {product.countInStock === 0 ? (
              <Button variant="light" disabled>
                Byashize mububiko
              </Button>
            ) : (
              <Button onClick={() => addToCartHandler(product)}>Add</Button>
            )}

            <Rating rating={product.rating} numReviews={product.numReviews} />
          </Card.Body>
        </Card>
      </div>
    );
  } else {
    return (
      <div>
        <Card style={cardStyle}>
          <Link to={`/product/${product.slug}`}>
            <img
              src={product.image}
              className="card-img-top"
              alt={product.name}
              style={imageStyle}
            />
          </Link>
          <Card.Body>
            <Link to={`/product/${product.slug}`}>
              <Card.Title>{product.name}</Card.Title>
            </Link>
            <Card.Text>{product.price} RWF</Card.Text>

            {product.countInStock === 0 ? (
              <Button variant="light" disabled>
                Byashize mububiko
              </Button>
            ) : (
              <Button onClick={() => addToCartHandler(product)}>Add</Button>
            )}

            <Rating rating={product.rating} numReviews={product.numReviews} />
          </Card.Body>
        </Card>
      </div>
    );
  }
}

export default Product;
