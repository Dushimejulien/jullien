import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "djw6nt4qg",
  api_key: "437314529849271",
  api_secret: "Apg9j5t7r7GT4hLIHYzeo4pLXw8",
});

async function testCloudinary() {
  try {
    const result = await cloudinary.api.ping();
    console.log("Cloudinary Connection Successful:", result);
  } catch (error) {
    console.error("Cloudinary Connection Failed:", error);
  }
}

testCloudinary();
