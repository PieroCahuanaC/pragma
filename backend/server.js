const express = require("express");
const oracledb = require("oracledb");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

oracledb.initOracleClient({
  libDir: "C:\\Program Files\\Oracle\\instantclient_23_7",
});

const dbConfig = {
  user: "PRAGMMA",
  password: "root",
  connectionString: "localhost:1521/FREEPDB1",
};

// Obtener instructores
app.get("/api/instructores", async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute("SELECT * FROM INSTRUCTOR");
    await connection.close();

    const instructores = result.rows.map((row) => ({
      id_instructor: row[0],
      nombre: row[1],
      apellido: row[2],
      email: row[3],
      telefono: row[4],
    }));

    res.json({ instructores });
  } catch (error) {
    console.error("Error en la API de instructores:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Obtener cursos
app.get("/api/curso", async (req, res) => {
  try {
    const connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute("SELECT * FROM CURSO");
    await connection.close();

    const cursos = result.rows.map((row) => ({
      id_curso: row[0],
      titulo: row[1],
      id_tipo: row[2],
      estado: row[3],
      id_instructor: row[4],
      id_categoria: row[5],
      precio: row[6],
    }));

    res.json({ cursos });
  } catch (error) {
    console.error("Error en la API de cursos:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/api/curso/:id", async (req, res) => {
  const { id } = req.params;
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      "SELECT * FROM CURSO WHERE ID_CURSO = :id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    const curso = {
      id_curso: result.rows[0][0],
      titulo: result.rows[0][1],
      id_tipo: result.rows[0][2],
      estado: result.rows[0][3],
      id_instructor: result.rows[0][4],
      id_categoria: result.rows[0][5],
      precio: result.rows[0][6],
    };

    res.json(curso);
  } catch (error) {
    console.error("Error al obtener el curso:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    if (connection) {
      await connection.close(); // Asegurar el cierre de la conexión
    }
  }
});

app.delete("/api/curso/:id", async (req, res) => {
  const { id } = req.params;
  console.log("ID recibido para eliminar:", id); // 👀 Verifica qué ID llega al backend

  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Verificar si el curso existe antes de eliminarlo
    const checkResult = await connection.execute(
      "SELECT ID_CURSO FROM CURSO WHERE ID_CURSO = :id",
      [id]
    );

    if (checkResult.rows.length === 0) {
      console.log("Curso no encontrado en la base de datos.");
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    // Eliminar el curso
    const result = await connection.execute(
      "DELETE FROM CURSO WHERE ID_CURSO = :id",
      [id],
      { autoCommit: true }
    );

    console.log("Filas afectadas:", result.rowsAffected);

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: "Curso no encontrado" });
    }

    res.json({ message: "Curso eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar el curso:", error);
    res
      .status(500)
      .json({ error: "Error interno del servidor", details: error.message });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// Agregar un nuevo curso
app.post("/api/curso", async (req, res) => {
  try {
    const {
      id_curso,
      titulo,
      id_tipo,
      estado,
      id_instructor,
      id_categoria,
      precio,
    } = req.body;

    console.log("Datos a insertar en Oracle:", req.body);

    if (!id_curso) {
      return res
        .status(400)
        .json({ error: "El ID del curso no puede ser NULL o vacío" });
    }

    const connection = await oracledb.getConnection(dbConfig);

    const sql = `INSERT INTO CURSO (ID_CURSO, TITULO, ID_TIPO, ESTADO, ID_INSTRUCTOR, ID_CATEGORIA, PRECIO) 
                 VALUES (:id_curso, :titulo, :id_tipo, :estado, :id_instructor, :id_categoria, :precio)`;

    const binds = {
      id_curso: { val: id_curso, type: oracledb.NUMBER },
      titulo: { val: titulo, type: oracledb.STRING },
      id_tipo: { val: id_tipo, type: oracledb.NUMBER },
      estado: { val: estado, type: oracledb.STRING },
      id_instructor: { val: id_instructor, type: oracledb.NUMBER },
      id_categoria: { val: id_categoria, type: oracledb.NUMBER },
      precio: { val: precio, type: oracledb.NUMBER },
    };

    console.log("Query SQL:", sql);
    console.log("Valores Bind:", binds);

    await connection.execute(sql, binds, { autoCommit: true });
    await connection.close();

    console.log("Curso agregado correctamente.");
    res.json({ message: "Curso agregado correctamente" });
  } catch (error) {
    console.error("Error al agregar el curso:", error);
    res.status(500).json({ error: "Error al agregar el curso" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
