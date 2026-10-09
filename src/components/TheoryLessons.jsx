import { lazy, Suspense } from 'react';
import '../theory.css';

const ComplexityGrowthChart = lazy(() => import('./ComplexityGrowthChart.jsx'));

export function ComplexityLesson() {
  const orderRows = [
    ['O(1)', 'Constante', 'Acceder a una posición conocida', 'No cambia'],
    ['O(log n)', 'Logarítmica', 'Búsqueda binaria', 'Aumenta muy poco'],
    ['O(n)', 'Lineal', 'Recorrer una lista', 'Se duplica'],
    ['O(n log n)', 'Lineal-logarítmica', 'Merge Sort', 'Algo más del doble'],
    ['O(n²)', 'Cuadrática', 'Dos ciclos completos', 'Se cuadruplica'],
    ['O(2ⁿ)', 'Exponencial', 'Explorar subconjuntos', 'Se eleva drásticamente'],
    ['O(n!)', 'Factorial', 'Probar todas las permutaciones', 'Crece más rápido que 2ⁿ'],
  ];

  return <section className="complexity-lesson" data-complexity-lesson>
    <article className="complexity-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es la complejidad algorítmica?</h2>
      <p>Es una forma de describir cómo aumenta el trabajo de un algoritmo cuando crece su entrada. En vez de medir segundos —que dependen del computador— se cuentan operaciones significativas y se expresa su crecimiento como una función de <b>n</b>.</p>
      <div className="complexity-foundations">
        <div><strong>n</strong><span>Tamaño del problema</span><p>Puede ser la cantidad de datos, vértices, filas o caracteres.</p></div>
        <div><strong>T(n)</strong><span>Tiempo</span><p>Cantidad de operaciones activas realizadas.</p></div>
        <div><strong>S(n)</strong><span>Espacio</span><p>Memoria adicional que necesita la solución.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · ANÁLISIS A PRIORI</span>
        <h3>Cómo analizar un algoritmo</h3>
        <ol>
          <li><b>Define n.</b> Explica exactamente qué parte de la entrada crece.</li>
          <li><b>Elige la operación activa.</b> Una comparación, visita, asignación o acceso representativo.</li>
          <li><b>Cuenta repeticiones.</b> Obtén una función T(n), no un tiempo del reloj.</li>
          <li><b>Separa los casos.</b> Mejor, promedio y peor escenario pueden ser distintos.</li>
          <li><b>Conserva el término dominante.</b> Clasifica el orden de crecimiento.</li>
        </ol>
      </article>
      <article>
        <span className="lesson-kicker">03 · CASOS</span>
        <h3>La misma entrada puede exigir trabajos distintos</h3>
        <div className="complexity-case-stack">
          <p><b>Mejor caso</b><span>La entrada más favorable requiere el mínimo trabajo.</span></p>
          <p><b>Caso promedio</b><span>Trabajo esperado bajo una distribución de entradas declarada.</span></p>
          <p><b>Peor caso</b><span>Máximo trabajo posible para cualquier entrada de tamaño n.</span></p>
        </div>
      </article>
    </div>

    <article className="complexity-chart-card">
      <div>
        <span className="lesson-kicker">04 · ÓRDENES DE CRECIMIENTO</span>
        <h3>Qué ocurre cuando n aumenta</h3>
        <p>El gráfico compara siete órdenes de crecimiento. O(log n) aumenta lentamente, mientras que O(n!) termina creciendo más rápido que O(2ⁿ).</p>
      </div>
      <Suspense fallback={null}><ComplexityGrowthChart language="es"/></Suspense>
    </article>

    <article className="complexity-order-table-card">
      <span className="lesson-kicker">05 · TABLA DE REFERENCIA</span>
      <h3>De más escalable a menos escalable</h3>
      <div className="complexity-order-table" role="table" aria-label="Comparación de órdenes de complejidad">
        <div className="table-head" role="row"><b>Orden</b><b>Nombre</b><b>Ejemplo</b><b>Al duplicar n</b></div>
        {orderRows.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · REGLAS DE CONTEO</span>
        <h3>Cómo nace T(n)</h3>
        <ul>
          <li>Las instrucciones consecutivas se <b>suman</b>.</li>
          <li>En una decisión se analiza cada rama y suele conservarse la más costosa para el peor caso.</li>
          <li>Un ciclo aporta sus iteraciones multiplicadas por el costo de su cuerpo.</li>
          <li>Los ciclos anidados completos suelen <b>multiplicar</b> sus tamaños.</li>
          <li>La recursividad se describe mediante una recurrencia que incluye sus llamadas y trabajo local.</li>
        </ul>
      </article>
      <article className="complexity-simplify-card">
        <span className="lesson-kicker">07 · SIMPLIFICAR</span>
        <h3>Importa lo que domina al crecer</h3>
        <div><span>T(n)</span><strong>4n² + 3n + 8</strong></div>
        <p>Se ignoran el factor constante, el término lineal y la constante porque <b>n²</b> termina creciendo más que todos ellos.</p>
        <div className="complexity-result"><span>Orden ajustado</span><strong>Θ(n²)</strong></div>
      </article>
    </div>

    <article className="complexity-notation-card">
      <span className="lesson-kicker">08 · NOTACIÓN ASINTÓTICA</span>
      <h3>O, Ω y Θ no significan exactamente lo mismo</h3>
      <div>
        <p><strong>O(g(n))</strong><b>Cota superior</b><span>Desde cierto n, el crecimiento no supera un múltiplo constante de g(n).</span></p>
        <p><strong>Ω(g(n))</strong><b>Cota inferior</b><span>Desde cierto n, el crecimiento es al menos un múltiplo constante de g(n).</span></p>
        <p><strong>Θ(g(n))</strong><b>Cota ajustada</b><span>g(n) limita el crecimiento simultáneamente por arriba y por abajo.</span></p>
      </div>
      <aside><b>Definición formal de O</b><span>Existen constantes positivas c y n₀ tales que 0 ≤ f(n) ≤ c·g(n) para todo n ≥ n₀.</span></aside>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · TIEMPO Y ESPACIO</span>
        <h3>Son análisis separados</h3>
        <p>Una solución puede ahorrar tiempo usando memoria auxiliar o ahorrar memoria repitiendo trabajo. Siempre debe indicarse si la complejidad mencionada es temporal o espacial y si el espacio incluye la propia entrada.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · ERRORES FRECUENTES</span>
        <h3>Antes de concluir, revisa</h3>
        <ul>
          <li>No confundir Big O con segundos exactos.</li>
          <li>No afirmar que O siempre representa el peor caso.</li>
          <li>No olvidar definir n y la operación contada.</li>
          <li>No sumar complejidades de ciclos que realmente están anidados.</li>
          <li>No comparar algoritmos usando tamaños de entrada distintos.</li>
        </ul>
      </article>
    </div>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>La pregunta no es solamente “¿funciona?”, sino <b>“¿seguirá funcionando bien cuando los datos crezcan?”</b>. La complejidad algorítmica permite responderla antes de ejecutar el programa.</p>
    </article>
  </section>;
}

export function DataStructuresLesson() {
  const operations = [
    ['Acceso', 'Llegar a un dato conocido', 'Array mediante índice'],
    ['Búsqueda', 'Encontrar un dato que cumple una condición', 'Hash por clave o recorrido'],
    ['Inserción', 'Agregar información sin romper las reglas', 'Nuevo nodo en una lista'],
    ['Actualización', 'Modificar un dato existente', 'Cambiar el valor de una posición'],
    ['Eliminación', 'Retirar un dato y reorganizar lo necesario', 'Desenlazar un nodo'],
    ['Recorrido', 'Visitar sistemáticamente los elementos', 'Inorden en un árbol'],
  ];
  const families = [
    { name: 'Lineales', examples: 'Array · Lista · Stack · Queue', text: 'Los elementos siguen una secuencia. Cada dato, salvo los extremos, tiene un anterior y un siguiente lógico.' },
    { name: 'Jerárquicas', examples: 'Árbol · Heap · Trie', text: 'Organizan relaciones de padre e hijos. Son útiles para niveles, prioridades, búsqueda y prefijos.' },
    { name: 'Redes', examples: 'Grafos', text: 'Representan entidades conectadas sin exigir una única jerarquía: rutas, dependencias, amistades o enlaces.' },
    { name: 'Por clave', examples: 'Hash · Map · Set', text: 'Transforman una clave para ubicar datos rápidamente y comprobar pertenencia.' },
  ];

  return <section className="complexity-lesson data-structures-lesson" data-data-structures-lesson>
    <article className="complexity-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es una estructura de datos?</h2>
      <p>Es una forma de <b>guardar, organizar y relacionar datos</b> para poder trabajar con ellos de manera clara y eficiente. No cambia lo que significan los datos: define dónde se encuentran, cómo se conectan y qué reglas deben respetarse al modificarlos.</p>
      <div className="complexity-foundations data-foundations">
        <div><strong>Datos</strong><span>Qué almacenamos</span><p>Números, textos, objetos, registros o relaciones.</p></div>
        <div><strong>Organización</strong><span>Cómo los ubicamos</span><p>Posiciones, índices, enlaces, claves o niveles.</p></div>
        <div><strong>Operaciones</strong><span>Qué necesitamos hacer</span><p>Buscar, insertar, eliminar, actualizar y recorrer.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · POR QUÉ EXISTEN</span>
        <h3>Organizar bien evita trabajo innecesario</h3>
        <p>Imagina miles de fichas sin ordenar dentro de una caja. La información existe, pero encontrar una ficha puede exigir revisarlas todas. Una estructura agrega un orden o una forma de acceso que facilita las operaciones importantes.</p>
        <p>Por eso un mismo conjunto de datos puede comportarse de manera muy distinta en un Array, una lista, un árbol o una tabla hash.</p>
      </article>
      <article>
        <span className="lesson-kicker">03 · TDA Y ESTRUCTURA</span>
        <h3>Qué debe hacer frente a cómo se construye</h3>
        <div className="data-concept-pair">
          <p><b>Tipo de Dato Abstracto (TDA)</b><span>Describe el comportamiento y las operaciones disponibles. Una pila promete push, pop y peek siguiendo LIFO.</span></p>
          <p><b>Estructura de datos</b><span>Es la organización concreta que hace posible ese comportamiento. La pila puede implementarse con un Array o con nodos enlazados.</span></p>
        </div>
      </article>
    </div>

    <article className="data-families-card">
      <span className="lesson-kicker">04 · FAMILIAS PRINCIPALES</span>
      <h3>No todos los datos se relacionan de la misma forma</h3>
      <div className="data-family-grid">
        {families.map((family, index) => <div key={family.name}>
          <i>{String(index + 1).padStart(2, '0')}</i>
          <strong>{family.name}</strong>
          <small>{family.examples}</small>
          <p>{family.text}</p>
        </div>)}
      </div>
    </article>

    <article className="complexity-order-table-card">
      <span className="lesson-kicker">05 · OPERACIONES BÁSICAS</span>
      <h3>Las preguntas que debe responder una estructura</h3>
      <div className="complexity-order-table data-operation-table" role="table" aria-label="Operaciones básicas de las estructuras de datos">
        <div className="table-head" role="row"><b>Operación</b><b>Pregunta</b><b>Ejemplo</b></div>
        {operations.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · CÓMO ELEGIR</span>
        <h3>Primero comprende el problema</h3>
        <ol>
          <li><b>Define los datos.</b> Qué representan y cuánto pueden crecer.</li>
          <li><b>Prioriza operaciones.</b> No es igual buscar mucho que insertar mucho.</li>
          <li><b>Decide si importa el orden.</b> Natural, ordenado, por prioridad o sin orden.</li>
          <li><b>Estudia sus costos.</b> Tiempo de las operaciones y memoria adicional.</li>
          <li><b>Considera los límites.</b> Tamaño fijo, duplicados, concurrencia o persistencia.</li>
        </ol>
      </article>
      <article>
        <span className="lesson-kicker">07 · INTERCAMBIOS</span>
        <h3>Ganar en una operación puede costar en otra</h3>
        <ul>
          <li>Un Array permite acceso directo, pero insertar al inicio desplaza elementos.</li>
          <li>Una lista enlazada inserta sin desplazar, pero no ofrece acceso directo por índice.</li>
          <li>Hashing busca muy rápido, pero no mantiene naturalmente los datos ordenados.</li>
          <li>Un árbol balanceado conserva orden, aunque debe mantener enlaces y balance.</li>
          <li>Un grafo representa conexiones generales, pero sus recorridos necesitan memoria auxiliar.</li>
        </ul>
      </article>
    </div>

    <article className="data-map-card">
      <span className="lesson-kicker">08 · MAPA DE DSA LAB</span>
      <h3>Una estructura para cada necesidad</h3>
      <div className="data-map-grid">
        <p><b>Posiciones conocidas</b><span>Array y matriz</span></p>
        <p><b>Secuencias flexibles</b><span>Listas con nexo</span></p>
        <p><b>Orden de atención</b><span>Stack, Queue y Deque</span></p>
        <p><b>Jerarquía y búsqueda</b><span>Árboles y heaps</span></p>
        <p><b>Acceso mediante clave</b><span>Hashing</span></p>
        <p><b>Relaciones y rutas</b><span>Grafos</span></p>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · EJEMPLO COTIDIANO</span>
        <h3>Una biblioteca usa varias estructuras</h3>
        <p>Los libros pueden ordenarse en estantes, localizarse mediante una ficha por código y los préstamos pendientes atenderse en una cola. Los datos siguen siendo libros y personas, pero cada tarea necesita una organización diferente.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · ERROR FRECUENTE</span>
        <h3>No existe una estructura universalmente mejor</h3>
        <p>La estructura correcta no es la más compleja ni la más rápida en una única prueba. Es la que ofrece el mejor equilibrio para las operaciones, el tamaño y las reglas del problema real.</p>
      </article>
    </div>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>Los algoritmos indican <b>qué pasos realizar</b>; las estructuras de datos determinan <b>cómo se organiza la información</b> sobre la que trabajan. Ambas decisiones se necesitan para construir una solución correcta y eficiente.</p>
    </article>
  </section>;
}

export function OopLesson() {
  const pillars = [
    ['Encapsulación', 'Protege el estado interno y permite modificarlo solamente mediante operaciones válidas.'],
    ['Abstracción', 'Muestra lo necesario para usar un objeto y oculta los detalles que no necesita conocer quien lo utiliza.'],
    ['Herencia', 'Permite que una clase especializada reutilice y amplíe el comportamiento de una clase más general.'],
    ['Polimorfismo', 'Permite tratar objetos diferentes mediante un mismo contrato y obtener el comportamiento propio de cada uno.'],
  ];
  const modifiers = [
    ['public', 'Desde cualquier clase', 'Operaciones que forman parte del contrato público.'],
    ['private', 'Solo dentro de la misma clase', 'Atributos y detalles internos que deben estar protegidos.'],
    ['protected', 'Misma clase, paquete y subclases', 'Extensión controlada mediante herencia.'],
    ['sin modificador', 'Clases del mismo paquete', 'Colaboración interna dentro de un paquete Java.'],
  ];

  return <section className="complexity-lesson oop-lesson" data-oop-lesson>
    <article className="complexity-intro-card oop-intro-card">
      <span className="lesson-kicker">01 · IDEA CENTRAL</span>
      <h2>¿Qué es la Programación Orientada a Objetos?</h2>
      <p>La <b>POO</b> es una manera de diseñar programas agrupando la información y las operaciones que trabajan con ella dentro de <b>objetos</b>. Cada objeto tiene un estado, puede realizar acciones y se comunica con otros objetos mediante métodos.</p>
      <p>No consiste solamente en escribir clases. Su propósito es repartir responsabilidades para que el programa sea más fácil de comprender, comprobar, cambiar y reutilizar.</p>
      <div className="complexity-foundations oop-foundations">
        <div><strong>Estado</strong><span>Lo que el objeto sabe</span><p>Se representa mediante atributos: nombre, saldo, tamaño o prioridad.</p></div>
        <div><strong>Comportamiento</strong><span>Lo que el objeto hace</span><p>Se expresa con métodos: depositar, insertar, buscar o calcular.</p></div>
        <div><strong>Identidad</strong><span>Qué objeto es</span><p>Dos objetos pueden tener datos iguales y seguir siendo instancias distintas.</p></div>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">02 · CLASE Y OBJETO</span>
        <h3>El plano y las instancias</h3>
        <p>Una <b>clase</b> es la definición o molde escrito por el programador. Indica qué atributos existirán y qué métodos podrán ejecutar sus objetos, pero la clase por sí sola no representa a un estudiante, una cuenta o una casa concreta.</p>
        <p>Un <b>objeto</b> es una instancia real creada a partir de esa clase mediante <code>new</code>. Ocupa un espacio en memoria, posee su propia identidad y conserva sus propios valores en los atributos. Una variable de tipo objeto no contiene todo el objeto: guarda una <b>referencia</b> que permite encontrarlo y utilizar sus métodos.</p>
        <div className="oop-object-example">
          <pre className="oop-code"><code>{`Estudiante ana = new Estudiante();
Estudiante luis = new Estudiante();

ana.nombre = "Ana";
luis.nombre = "Luis";`}</code></pre>
          <p><code>ana</code> y <code>luis</code> fueron creados desde la misma clase <code>Estudiante</code>, pero son <b>dos objetos diferentes</b>. Cada uno tiene su propia identidad y puede guardar un nombre distinto sin modificar al otro.</p>
        </div>
        <div className="oop-analogy"><b>Clase: el plano de una casa</b><span>Objeto: cada casa que se construye utilizando ese plano. Todas comparten la estructura definida por el plano, pero cada casa existe por separado y puede tener un color, una dirección y habitantes diferentes.</span></div>
      </article>
      <article>
        <span className="lesson-kicker">03 · PRIMER OBJETO</span>
        <h3>Una clase pequeña en Java</h3>
        <pre className="oop-code"><code>{`class Estudiante {
    String nombre;
    int puntaje;

    void estudiar() {
        puntaje = puntaje + 1;
    }
}

Estudiante ana = new Estudiante();
ana.nombre = "Ana";
ana.estudiar();`}</code></pre>
        <p><code>ana</code> guarda una referencia al objeto; <code>new</code> crea la instancia; el punto permite acceder a sus miembros.</p>
      </article>
    </div>

    <article className="oop-process-card">
      <span className="lesson-kicker">04 · DE UN PROBLEMA A UNA CLASE</span>
      <h3>Modelar significa decidir responsabilidades</h3>
      <div className="oop-process">
        <div><i>1</i><b>Identifica entidades</b><span>¿Qué elementos tienen información y comportamiento propio?</span></div>
        <div><i>2</i><b>Asigna estado</b><span>¿Qué datos necesita conservar cada objeto?</span></div>
        <div><i>3</i><b>Asigna acciones</b><span>¿Qué operaciones debe realizar y qué reglas debe proteger?</span></div>
        <div><i>4</i><b>Conecta objetos</b><span>¿Quién usa a quién y qué información debe intercambiar?</span></div>
      </div>
    </article>

    <article className="oop-pillars-card">
      <span className="lesson-kicker">05 · LOS CUATRO PILARES</span>
      <h3>Principios que guían el diseño orientado a objetos</h3>
      <div className="oop-pillar-grid">
        {pillars.map((pillar, index) => <div key={pillar[0]}><i>{String(index + 1).padStart(2, '0')}</i><strong>{pillar[0]}</strong><p>{pillar[1]}</p></div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">06 · CONSTRUCTOR Y THIS</span>
        <h3>Crear objetos válidos desde el comienzo</h3>
        <pre className="oop-code"><code>{`class Cuenta {
    private String titular;
    private int saldo;

    Cuenta(String titular, int saldoInicial) {
        this.titular = titular;
        this.saldo = saldoInicial;
    }
}`}</code></pre>
        <p>El constructor tiene el mismo nombre de la clase y no declara retorno. <code>this</code> representa al objeto actual y permite distinguir el atributo del parámetro.</p>
      </article>
      <article>
        <span className="lesson-kicker">07 · ENCAPSULACIÓN</span>
        <h3>No expongas datos que cualquiera pueda romper</h3>
        <pre className="oop-code"><code>{`public void retirar(int cantidad) {
    if (cantidad > 0 && cantidad <= saldo) {
        saldo = saldo - cantidad;
    }
}

public int getSaldo() {
    return saldo;
}`}</code></pre>
        <p>Al mantener <code>saldo</code> privado, toda modificación pasa por un método que comprueba las reglas. Un setter no es obligatorio: solo debe existir si modificar directamente ese dato tiene sentido.</p>
      </article>
    </div>

    <article className="complexity-order-table-card oop-access-card">
      <span className="lesson-kicker">08 · MODIFICADORES DE ACCESO</span>
      <h3>Controlan quién puede utilizar cada miembro</h3>
      <div className="complexity-order-table oop-access-table" role="table" aria-label="Modificadores de acceso de Java">
        <div className="table-head" role="row"><b>Modificador</b><b>Acceso</b><b>Uso habitual</b></div>
        {modifiers.map(row => <div role="row" key={row[0]}>{row.map((cell, index) => <span role="cell" key={cell}>{index === 0 ? <strong>{cell}</strong> : cell}</span>)}</div>)}
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">09 · HERENCIA</span>
        <h3>Una relación «es un»</h3>
        <pre className="oop-code"><code>{`class Animal {
    public void hacerSonido() {
        System.out.println("Sonido");
    }
}

class Perro extends Animal {
    @Override
    public void hacerSonido() {
        System.out.println("Guau");
    }
}`}</code></pre>
        <p><code>Perro</code> es un <code>Animal</code>. Hereda su contrato y reemplaza un comportamiento. La herencia debe representar una relación real, no utilizarse solamente para ahorrar líneas.</p>
      </article>
      <article>
        <span className="lesson-kicker">10 · POLIMORFISMO</span>
        <h3>Un contrato, varios comportamientos</h3>
        <pre className="oop-code"><code>{`Animal mascota = new Perro();
mascota.hacerSonido(); // imprime "Guau"`}</code></pre>
        <p>La variable tiene tipo <code>Animal</code>, pero el objeto real es un <code>Perro</code>. Java elige en ejecución el método sobrescrito del objeto real. Así podemos agregar nuevas clases sin reescribir el código que usa el contrato general.</p>
      </article>
    </div>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">11 · INTERFACES</span>
        <h3>Definen una capacidad</h3>
        <pre className="oop-code"><code>{`interface Dibujable {
    void dibujar();
}

class Circulo implements Dibujable {
    public void dibujar() {
        System.out.println("Dibujo un círculo");
    }
}`}</code></pre>
        <p>Una interfaz declara qué se puede hacer sin imponer una única implementación. Una clase puede implementar varias interfaces.</p>
      </article>
      <article>
        <span className="lesson-kicker">12 · COMPOSICIÓN</span>
        <h3>Una relación «tiene un»</h3>
        <pre className="oop-code"><code>{`class Motor {
    void encender() { }
}

class Auto {
    private Motor motor = new Motor();

    void arrancar() {
        motor.encender();
    }
}`}</code></pre>
        <p>Un <code>Auto</code> tiene un <code>Motor</code>. La composición permite cambiar piezas con menos acoplamiento y suele ser más flexible que crear cadenas largas de herencia.</p>
      </article>
    </div>

    <article className="oop-comparison-card">
      <span className="lesson-kicker">13 · CONCEPTOS QUE SE CONFUNDEN</span>
      <h3>Sobrecarga no es sobrescritura</h3>
      <div className="data-concept-pair">
        <p><b>Sobrecarga (overload)</b><span>En la misma clase hay métodos con igual nombre y distintos parámetros. El compilador decide cuál usar.</span><code>sumar(int a, int b)</code><code>sumar(double a, double b)</code></p>
        <p><b>Sobrescritura (override)</b><span>Una subclase redefine un método heredado conservando su firma. El objeto real decide cuál se ejecuta.</span><code>@Override hacerSonido()</code></p>
      </div>
    </article>

    <article className="oop-complete-example">
      <span className="lesson-kicker">14 · EJEMPLO COMPLETO</span>
      <h3>Una pila encapsulada con objetos</h3>
      <p>La clase mantiene privado el arreglo y controla su regla LIFO. Quien usa la pila no necesita conocer cómo se guarda internamente.</p>
      <pre className="oop-code"><code>{`class Pila {
    private int[] datos;
    private int size;

    Pila(int capacidad) {
        datos = new int[capacidad];
        size = 0;
    }

    public boolean estaVacia() {
        return size == 0;
    }

    public void push(int valor) {
        if (size < datos.length) {
            datos[size] = valor;
            size = size + 1;
        }
    }

    public int pop() {
        if (estaVacia()) {
            throw new IllegalStateException("Pila vacía");
        }
        size = size - 1;
        return datos[size];
    }
}

Pila numeros = new Pila(5);
numeros.push(10);
numeros.push(20);
int ultimo = numeros.pop(); // 20`}</code></pre>
      <div className="oop-example-notes">
        <p><b>Abstracción</b><span>El usuario piensa en push y pop, no en índices.</span></p>
        <p><b>Encapsulación</b><span>datos y size son privados.</span></p>
        <p><b>Invariante</b><span>size siempre permanece entre 0 y la capacidad.</span></p>
      </div>
    </article>

    <div className="complexity-theory-grid">
      <article>
        <span className="lesson-kicker">15 · STATIC E INSTANCIA</span>
        <h3>¿Pertenece a la clase o a cada objeto?</h3>
        <ul>
          <li>Un miembro de <b>instancia</b> existe por separado en cada objeto y se usa mediante una referencia.</li>
          <li>Un miembro <b>static</b> pertenece a la clase y se comparte entre todas sus instancias.</li>
          <li>Usa <code>static</code> para constantes o funciones que no dependen del estado de un objeto; no para convertir todo en variables globales.</li>
        </ul>
      </article>
      <article>
        <span className="lesson-kicker">16 · REFERENCIAS Y NULL</span>
        <h3>La variable no contiene el objeto completo</h3>
        <p>Una variable de tipo objeto guarda una <b>referencia</b>. Dos variables pueden apuntar a la misma instancia; modificarla mediante una referencia también se observa desde la otra.</p>
        <p><code>null</code> significa que no hay un objeto referenciado. Invocar un método mediante <code>null</code> produce <code>NullPointerException</code>.</p>
      </article>
    </div>

    <article className="oop-mistakes-card">
      <span className="lesson-kicker">17 · ERRORES FRECUENTES</span>
      <h3>Señales para revisar el diseño</h3>
      <div className="oop-mistake-grid">
        <p><b>Todo es public</b><span>Cualquier parte del programa puede dejar al objeto en un estado inválido.</span></p>
        <p><b>Clase gigante</b><span>Una sola clase concentra responsabilidades que deberían separarse.</span></p>
        <p><b>Herencia forzada</b><span>Se usa <code>extends</code> aunque no exista una relación real «es un».</span></p>
        <p><b>Solo getters y setters</b><span>El objeto expone datos, pero no protege reglas ni expresa comportamiento.</span></p>
        <p><b>Comparar objetos con ==</b><span><code>==</code> compara referencias; para contenido normalmente se define y usa <code>equals</code>.</span></p>
        <p><b>Ignorar null</b><span>Se usa una referencia sin comprobar que realmente apunta a un objeto.</span></p>
      </div>
    </article>

    <article className="oop-checklist-card">
      <span className="lesson-kicker">18 · GUÍA PARA DISEÑAR</span>
      <h3>Preguntas antes de terminar una clase</h3>
      <ol>
        <li>¿La clase tiene una responsabilidad clara que puedo explicar en una frase?</li>
        <li>¿Sus atributos están protegidos y el constructor crea un estado válido?</li>
        <li>¿Cada método expresa una acción del objeto y valida sus entradas?</li>
        <li>¿La relación es realmente herencia o sería más clara mediante composición?</li>
        <li>¿El código que usa la clase depende de un contrato pequeño y comprensible?</li>
      </ol>
    </article>

    <article className="complexity-summary-card">
      <span className="lesson-kicker">IDEA PARA RECORDAR</span>
      <p>Un buen objeto <b>conoce su propio estado, protege sus reglas y ofrece operaciones claras</b>. La POO no busca crear la mayor cantidad de clases: busca que cada parte del programa tenga una responsabilidad entendible.</p>
    </article>
  </section>;
}
