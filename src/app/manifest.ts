import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Rinconcito del Sabor",
        short_name: "Rinconcito",
        description: "Operación integral del restaurante",
        start_url: "/",
        display: "standalone",
        background_color: "#f4f6f3",
        theme_color: "#173d2c",
        orientation: "any",
        icons: [{ src: "https://res.cloudinary.com/dgaq5afjl/image/upload/v1791822409/c615f1f8-e397-4c21-b780-c8ce2b41aa45.png", sizes: "any", type: "image/svg+xml" }],
    };
}
