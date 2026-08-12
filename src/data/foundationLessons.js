const section = (title, text, code = '', bullets = []) => ({ title, text, code, bullets });

const lesson = ({ id, name, navName, scope, summary, pseudocode, values, intro, essentials, sections, mistakes, checklist, remember }) => ({
  id, name, navName, scope, summary, pseudocode, values, intro, essentials, sections, mistakes, checklist, remember,
  guide: {
    definition: intro,
    how: sections.map(item => `${item.title}: ${item.text}`).join(' '),
    operations: sections.map(item => item.title),
    strengths: [...essentials.map(item => `${item.term}: ${item.text}`), `Integración: ${remember}`],
    limits: mistakes,
    uses: checklist,
    example: sections.find(item => item.code)?.text ?? sections[0].text,
    tip: remember,
  },
});

export const foundationLessons = [
  lesson({
    id: 'variables-tipos-operadores', name: 'Variables, tipos y operadores', navName: 'Variables y tipos',
    scope: 'Datos primitivos · String · Operadores · Conversión',
    summary: 'Comprende cómo Java representa valores, los guarda en variables y construye expresiones mediante operadores.',
    pseudocode: 'declarar tipo nombre\nasignar un valor compatible\ncombinar valores con operadores\nobservar el resultado', values: ['int', 'boolean', 'String'],
    intro: 'Una variable es un nombre asociado a un espacio donde el programa conserva un valor. Su tipo determina qué clase de dato puede guardar, qué operaciones admite y cuánta precisión necesita. En Java el tipo se declara antes de utilizar la variable.',
    essentials: [
      { term: 'Tipo', label: 'Qué puede guardar', text: 'int almacena enteros, double decimales, boolean valores lógicos y char un carácter.' },
      { term: 'Variable', label: 'Nombre del dato', text: 'Permite leer y modificar un valor durante la ejecución.' },
      { term: 'Expresión', label: 'Cálculo con valores', text: 'Combina variables, literales y operadores para producir un resultado.' },
    ],
    sections: [
      section('Declarar, inicializar y asignar', 'Declarar crea el nombre y fija el tipo; inicializar entrega el primer valor; asignar reemplaza el valor anterior.', `int edad;          // declaración
edad = 18;         // primera asignación
edad = edad + 1;   // ahora vale 19`),
      section('Tipos primitivos y referencias', 'Los primitivos guardan directamente un valor simple. String, arreglos y objetos se utilizan mediante referencias.', `int cantidad = 4;
double precio = 2.5;
boolean disponible = true;
char inicial = 'A';
String nombre = "Ana";`),
      section('Operadores', 'Los aritméticos calculan; los relacionales comparan; y los lógicos combinan condiciones.', `int total = 4 + 3 * 2;       // 10
boolean mayor = total > 5;    // true
boolean acceso = mayor && disponible;`),
      section('Conversión y división entera', 'Una operación entre enteros produce un entero. Para conservar decimales se necesita al menos un operando double.', `int a = 5 / 2;          // 2
double b = 5.0 / 2;     // 2.5
int entero = (int) b;   // 2`),
    ],
    mistakes: ['Usar una variable antes de inicializarla', 'Comparar String con == en vez de equals', 'Esperar decimales al dividir dos int', 'Guardar un valor fuera del rango del tipo'],
    checklist: ['Elegir el tipo más claro para el dato', 'Usar nombres que expliquen el propósito', 'Revisar precedencia con paréntesis', 'Comprobar conversiones que pierden información'],
    remember: 'El tipo responde qué puede guardar una variable; el nombre explica para qué se usa; y la expresión determina el nuevo valor.',
  }),
  lesson({
    id: 'condiciones-ciclos', name: 'Condiciones y ciclos', navName: 'Condiciones y ciclos',
    scope: 'if · else · switch · for · while',
    summary: 'Aprende cómo un algoritmo toma decisiones y repite instrucciones sin perder de vista cada condición e iteración.',
    pseudocode: 'evaluar una condición\nejecutar solamente la rama verdadera\nrepetir mientras corresponda\nactualizar la variable de control', values: ['if', 'for', 'while'],
    intro: 'Las estructuras de control deciden qué instrucciones se ejecutan y cuántas veces. Una condición siempre produce true o false; un ciclo vuelve a evaluar su condición antes de continuar. Comprender ese flujo evita imaginar que Java entra en todas las ramas.',
    essentials: [
      { term: 'if', label: 'Decisión', text: 'Ejecuta su bloque únicamente cuando la condición es verdadera.' },
      { term: 'for', label: 'Repetición contada', text: 'Agrupa inicio, condición y actualización de la variable de control.' },
      { term: 'while', label: 'Repetición condicional', text: 'Se utiliza cuando no se conoce previamente la cantidad de iteraciones.' },
    ],
    sections: [
      section('Condiciones y ramas', 'if evalúa una condición. Si es falsa puede continuar con else if, else o con la instrucción posterior.', `if (nota >= 4.0) {
    System.out.println("Aprobado");
} else {
    System.out.println("Debe reforzar");
}`),
      section('Ciclo for', 'Es apropiado para recorrer índices. En un arreglo de tamaño n, el último índice válido es n - 1.', `for (int i = 0; i < datos.length; i++) {
    System.out.println(datos[i]);
}`),
      section('Ciclo while', 'Comprueba la condición antes de cada vuelta. El bloque debe producir algún cambio que permita terminar.', `int actual = 1;
while (actual < 100) {
    actual = actual * 2;
}`),
      section('break y continue', 'break termina el ciclo completo; continue omite el resto de la iteración actual. Deben usarse cuando aclaran el flujo.', `for (int valor : datos) {
    if (valor < 0) continue;
    if (valor == objetivo) break;
}`),
    ],
    mistakes: ['Confundir = con ==', 'Usar <= length y salir del arreglo', 'Olvidar actualizar la condición de un while', 'Creer que if y else se ejecutan juntos'],
    checklist: ['Escribir el valor inicial', 'Evaluar la condición como true o false', 'Anotar el cambio de cada iteración', 'Comprobar por qué el ciclo termina'],
    remember: 'Un bloque no se ejecuta por estar escrito: primero debe alcanzarse y su condición debe permitir la entrada.',
  }),
  lesson({
    id: 'metodos-parametros', name: 'Métodos y parámetros', navName: 'Métodos y parámetros',
    scope: 'Firma · Parámetros · Retorno · Alcance',
    summary: 'Divide algoritmos en operaciones pequeñas, explícitas y reutilizables que reciben datos y producen resultados.',
    pseudocode: 'definir nombre, entradas y retorno\nvalidar los parámetros\nrealizar una responsabilidad\nretornar el resultado', values: ['parámetro', 'return', 'void'],
    intro: 'Un método reúne instrucciones que realizan una tarea concreta. Su firma comunica el nombre, los parámetros y el tipo de retorno. Los parámetros son variables locales que reciben los argumentos enviados durante una llamada.',
    essentials: [
      { term: 'Entrada', label: 'Parámetros', text: 'Datos que el método necesita para realizar su trabajo.' },
      { term: 'Proceso', label: 'Cuerpo', text: 'Instrucciones y decisiones que pertenecen a una responsabilidad.' },
      { term: 'Salida', label: 'Retorno', text: 'Resultado entregado al lugar desde donde se hizo la llamada.' },
    ],
    sections: [
      section('Firma y llamada', 'El tipo anterior al nombre indica qué devuelve. Los argumentos deben coincidir en cantidad y tipos con los parámetros.', `static int sumar(int a, int b) {
    return a + b;
}

int resultado = sumar(3, 4);`),
      section('void y return', 'void significa que no se devuelve un valor. return también puede terminar anticipadamente un método.', `static void mostrarPositivo(int valor) {
    if (valor <= 0) return;
    System.out.println(valor);
}`),
      section('Alcance de variables', 'Una variable local existe solamente dentro del bloque donde fue declarada. Dos métodos no comparten automáticamente sus variables locales.', `static int doble(int valor) {
    int resultado = valor * 2;
    return resultado;
}`),
      section('Paso de argumentos en Java', 'Java siempre pasa argumentos por valor. En objetos se copia el valor de la referencia, por lo que ambos accesos pueden llegar al mismo objeto.', `static void renombrar(Estudiante e) {
    e.nombre = "Nuevo";
}`),
    ],
    mistakes: ['Olvidar retornar en todos los caminos', 'Crear métodos que hacen demasiadas tareas', 'Confundir parámetro con argumento', 'Esperar que una reasignación local cambie la variable externa'],
    checklist: ['Nombrar el método con un verbo', 'Mantener una responsabilidad clara', 'Validar parámetros inválidos', 'Usar el valor retornado cuando corresponda'],
    remember: 'Un método claro responde cuatro preguntas: cómo se llama, qué recibe, qué hace y qué devuelve.',
  }),
  lesson({
    id: 'memoria-referencias', name: 'Memoria y referencias', navName: 'Memoria y referencias',
    scope: 'Stack · Heap · Referencias · null · Alias',
    summary: 'Comprende dónde viven variables y objetos, qué guarda una referencia y por qué varios enlaces pueden llegar al mismo nodo.',
    pseudocode: 'crear un objeto en memoria\nguardar su referencia\ncopiar o cambiar referencias\ncomprobar null antes de acceder', values: ['stack', 'heap', 'null'],
    intro: 'Para razonar sobre nodos, árboles y objetos hay que distinguir el valor de una referencia del objeto al que apunta. Una referencia permite localizar un objeto; copiarla no duplica el objeto. Dos variables pueden llegar a la misma instancia y observar los mismos cambios.',
    essentials: [
      { term: 'Stack', label: 'Llamadas y variables locales', text: 'Cada llamada mantiene sus parámetros, variables locales y punto de retorno.' },
      { term: 'Heap', label: 'Objetos creados', text: 'new reserva objetos cuya vida puede superar a una llamada particular.' },
      { term: 'Referencia', label: 'Camino al objeto', text: 'Guarda cómo acceder a una instancia; null indica que no apunta a ninguna.' },
    ],
    sections: [
      section('Crear y referenciar', 'new crea el objeto y devuelve una referencia. La variable guarda esa referencia, no una copia completa de la instancia.', `Nodo primero = new Nodo(10);
Nodo segundo = new Nodo(20);
primero.next = segundo;`),
      section('Alias', 'Copiar una referencia crea otro nombre para el mismo objeto. Modificarlo desde cualquiera de las referencias afecta a la única instancia compartida.', `Nodo a = new Nodo(10);
Nodo b = a;
b.valor = 99;
System.out.println(a.valor); // 99`),
      section('null y enlaces', 'null representa ausencia de objeto. Antes de seguir next, left o right hay que comprobar que la referencia existe.', `Nodo actual = head;
while (actual != null) {
    System.out.println(actual.valor);
    actual = actual.next;
}`),
      section('Recolección de basura', 'Un objeto sin referencias alcanzables puede ser recuperado automáticamente por Java. Asignar null no destruye de inmediato: elimina un camino hacia el objeto.'),
    ],
    mistakes: ['Creer que copiar una referencia clona el objeto', 'Seguir next cuando actual es null', 'Perder head antes de guardar el siguiente nodo', 'Confundir el heap de memoria con la estructura Heap'],
    checklist: ['Dibujar variables y objetos por separado', 'Representar cada referencia con una flecha', 'Marcar explícitamente null', 'Actualizar enlaces en un orden que no pierda nodos'],
    remember: 'Las variables de referencia son flechas, no cajas que contienen el objeto completo.',
  }),
  lesson({
    id: 'recursividad-fundamentos', name: 'Fundamentos de recursividad', navName: 'Recursividad',
    scope: 'Caso base · Llamada · Pila · Retorno',
    summary: 'Entiende cómo un método resuelve un problema mediante versiones más pequeñas y cómo regresan sus llamadas.',
    pseudocode: 'comprobar el caso base\nreducir el problema\nrealizar la llamada recursiva\ncombinar el resultado al volver', values: ['base', 'llamada', 'retorno'],
    intro: 'La recursividad ocurre cuando un método se llama directa o indirectamente a sí mismo. Cada llamada recibe su propio estado. Para terminar necesita un caso base alcanzable y cada llamada debe acercar el problema a ese caso.',
    essentials: [
      { term: 'Base', label: 'Detiene', text: 'Resuelve directamente el caso más pequeño sin volver a llamar.' },
      { term: 'Paso', label: 'Reduce', text: 'Transforma la entrada en un problema más cercano al caso base.' },
      { term: 'Retorno', label: 'Reconstruye', text: 'Las llamadas pendientes continúan en orden inverso al que entraron.' },
    ],
    sections: [
      section('Factorial paso a paso', 'factorial(4) espera a factorial(3), que espera a factorial(2). Al llegar a 1 comienzan los retornos.', `static int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`),
      section('Pila de llamadas', 'Cada llamada conserva su n y la operación pendiente. La llamada más reciente termina primero, igual que una pila LIFO.'),
      section('Recorrer estructuras recursivas', 'Un árbol puede procesarse aplicando el mismo algoritmo a cada subárbol. null funciona como caso base.', `static void inorden(Nodo nodo) {
    if (nodo == null) return;
    inorden(nodo.left);
    System.out.println(nodo.valor);
    inorden(nodo.right);
}`),
      section('Recursividad y backtracking', 'Backtracking agrega una decisión, continúa recursivamente y la deshace si no conduce a una solución.'),
    ],
    mistakes: ['No definir caso base', 'No acercarse al caso base', 'Olvidar usar el resultado retornado', 'Confundir entrada de llamadas con regreso de llamadas'],
    checklist: ['Identificar el problema más pequeño', 'Demostrar que cada llamada reduce el problema', 'Anotar qué queda pendiente', 'Comprobar profundidad y memoria'],
    remember: 'Bajar crea llamadas pendientes; llegar al caso base detiene el descenso; volver resuelve lo que quedó esperando.',
  }),
  lesson({
    id: 'tipos-datos-abstractos', name: 'Tipos de Datos Abstractos (TDA)', navName: 'TDA',
    scope: 'Contrato · Operaciones · Implementación · Invariantes',
    summary: 'Distingue qué comportamiento promete una estructura de la manera concreta utilizada para construirla.',
    pseudocode: 'definir operaciones públicas\nestablecer reglas observables\nelegir una implementación\nmantener el contrato', values: ['contrato', 'pila', 'implementación'],
    intro: 'Un Tipo de Dato Abstracto describe un conjunto de valores, operaciones y reglas observables sin imponer cómo se almacenan internamente. Una pila promete push, pop y peek con orden LIFO; puede implementarse con un arreglo o con nodos.',
    essentials: [
      { term: 'Contrato', label: 'Qué promete', text: 'Operaciones disponibles, resultados y errores permitidos.' },
      { term: 'Implementación', label: 'Cómo lo logra', text: 'Arreglos, nodos, tablas u otras estructuras internas.' },
      { term: 'Invariante', label: 'Qué siempre se cumple', text: 'Regla interna que toda operación debe conservar.' },
    ],
    sections: [
      section('Interfaz pública', 'Quien utiliza el TDA conoce las operaciones, pero no necesita acceder a sus datos internos.', `interface Pila {
    void push(int valor);
    int pop();
    int peek();
    boolean estaVacia();
}`),
      section('Múltiples implementaciones', 'PilaArray usa índices y capacidad; PilaEnlazada usa nodos. Ambas pueden cumplir exactamente el mismo contrato.'),
      section('Precondiciones y postcondiciones', 'Una precondición debe cumplirse antes de llamar; una postcondición describe el resultado garantizado después.'),
      section('Complejidad como parte de la decisión', 'Dos implementaciones pueden ser correctas y ofrecer costos distintos. La elección depende del crecimiento y las operaciones prioritarias.'),
    ],
    mistakes: ['Confundir el TDA con una única implementación', 'Exponer atributos internos', 'Cambiar reglas entre métodos', 'Omitir qué ocurre ante una estructura vacía'],
    checklist: ['Enumerar operaciones públicas', 'Definir reglas y errores', 'Elegir representación interna', 'Verificar invariantes después de modificar'],
    remember: 'El TDA dice qué debe ocurrir; la estructura concreta decide cómo hacerlo.',
  }),
  lesson({
    id: 'genericos-java', name: 'Genéricos en Java', navName: 'Genéricos',
    scope: 'T · Seguridad de tipos · Clases · Métodos',
    summary: 'Construye estructuras reutilizables capaces de trabajar con diferentes tipos sin perder comprobación del compilador.',
    pseudocode: 'declarar un parámetro de tipo T\nusarlo en atributos y métodos\nelegir el tipo al crear\nevitar conversiones inseguras', values: ['T', 'Node<T>', 'List<Integer>'],
    intro: 'Los genéricos permiten escribir una clase o método dejando uno o más tipos como parámetros. El compilador comprueba que los valores utilizados sean compatibles y evita muchas conversiones manuales.',
    essentials: [
      { term: 'T', label: 'Parámetro de tipo', text: 'Representa un tipo que se decidirá al utilizar la clase o el método.' },
      { term: '<Integer>', label: 'Argumento de tipo', text: 'Concreta qué elementos puede almacenar una instancia.' },
      { term: 'Seguridad', label: 'Error temprano', text: 'El compilador rechaza mezclas incompatibles antes de ejecutar.' },
    ],
    sections: [
      section('Nodo genérico', 'La misma clase puede crear nodos de Integer, String, Estudiante u otros tipos de referencia.', `class Nodo<T> {
    T valor;
    Nodo<T> next;

    Nodo(T valor) {
        this.valor = valor;
    }
}`),
      section('Crear instancias', 'Cada instancia conserva un tipo concreto. El operador diamante permite que Java lo infiera.', `Nodo<Integer> numero = new Nodo<>(10);
Nodo<String> palabra = new Nodo<>("DSA");`),
      section('Métodos genéricos', 'Un método puede declarar su propio parámetro de tipo aunque la clase no sea genérica.', `static <T> T primero(T[] datos) {
    return datos[0];
}`),
      section('Límites', 'Los genéricos de Java trabajan con tipos de referencia. Para números primitivos se usan envoltorios como Integer y Double.'),
    ],
    mistakes: ['Usar tipos crudos como List sin parámetro', 'Intentar crear new T directamente', 'Mezclar Integer y String en una instancia', 'Agregar comodines sin comprender lectura y escritura'],
    checklist: ['Usar T cuando el algoritmo no depende del tipo concreto', 'Elegir nombres claros para varios parámetros', 'Evitar casts innecesarios', 'Preferir tipos parametrizados completos'],
    remember: 'Un genérico reutiliza el algoritmo, pero mantiene explícito qué tipo de dato acepta cada instancia.',
  }),
  lesson({
    id: 'errores-excepciones', name: 'Errores y excepciones', navName: 'Errores y excepciones',
    scope: 'Validación · throw · try · catch · finally',
    summary: 'Diferencia datos inválidos, fallos de ejecución y errores de programación, y aprende a tratarlos sin ocultarlos.',
    pseudocode: 'validar antes de operar\nlanzar una excepción significativa\ncapturar solo donde pueda resolverse\nconservar el estado válido', values: ['throw', 'try', 'catch'],
    intro: 'Una excepción representa una situación que interrumpe el flujo normal. Puede indicar una entrada inválida, una estructura vacía o un recurso que falló. El objetivo no es capturar todo, sino detectar problemas en el nivel adecuado y mantener información suficiente para corregirlos.',
    essentials: [
      { term: 'Validar', label: 'Prevenir', text: 'Comprueba condiciones antes de acceder o modificar datos.' },
      { term: 'throw', label: 'Informar', text: 'Crea una señal explícita cuando una operación no puede cumplir su contrato.' },
      { term: 'catch', label: 'Recuperar', text: 'Trata solamente excepciones ante las que el programa puede responder.' },
    ],
    sections: [
      section('Lanzar una excepción', 'Una pila vacía no puede devolver un elemento válido. La excepción comunica claramente el incumplimiento.', `int pop() {
    if (size == 0) {
        throw new IllegalStateException("Pila vacía");
    }
    return datos[--size];
}`),
      section('try y catch', 'El bloque try contiene la operación que puede fallar; catch recibe un tipo específico y decide cómo continuar.', `try {
    int numero = Integer.parseInt(texto);
} catch (NumberFormatException error) {
    System.out.println("Escribe un entero válido");
}`),
      section('Checked y unchecked', 'Las checked deben declararse o capturarse; las unchecked suelen señalar argumentos inválidos o errores de programación.'),
      section('Estado consistente', 'Una operación debe validar antes de modificar o poder deshacer cambios parciales. Nunca conviene dejar enlaces o tamaños a medio actualizar.'),
    ],
    mistakes: ['Usar catch Exception sin una razón', 'Ignorar silenciosamente el error', 'Usar excepciones como condiciones normales de ciclos', 'Modificar el estado antes de validar todo'],
    checklist: ['Validar límites y null', 'Elegir una excepción significativa', 'Agregar contexto al mensaje', 'Capturar únicamente donde exista recuperación'],
    remember: 'Una buena excepción no esconde el problema: protege el estado y explica por qué la operación no pudo completarse.',
  }),
  lesson({
    id: 'comparacion-ordenamiento-objetos', name: 'Comparación y ordenamiento de objetos', navName: 'Comparar objetos',
    scope: '== · equals · Comparable · Comparator',
    summary: 'Define cuándo dos objetos se consideran iguales y bajo qué criterio pueden ordenarse en estructuras y algoritmos.',
    pseudocode: 'distinguir identidad de contenido\ndefinir igualdad coherente\nelegir un criterio de orden\nusarlo en búsquedas y estructuras', values: ['equals', 'compareTo', 'Comparator'],
    intro: 'Comparar objetos puede significar preguntar si son la misma instancia, si contienen información equivalente o cuál debe aparecer primero. Java ofrece herramientas distintas para cada pregunta y utilizarlas correctamente es esencial en hashing, árboles y ordenamientos.',
    essentials: [
      { term: '==', label: 'Identidad', text: 'En referencias comprueba si ambas apuntan exactamente al mismo objeto.' },
      { term: 'equals', label: 'Equivalencia', text: 'Define cuándo dos objetos representan el mismo contenido lógico.' },
      { term: 'Comparator', label: 'Orden alternativo', text: 'Permite comparar con criterios externos sin modificar la clase.' },
    ],
    sections: [
      section('Identidad y contenido', 'Dos String u objetos distintos pueden contener información equivalente sin compartir identidad.', `String a = new String("DSA");
String b = new String("DSA");

System.out.println(a == b);      // false
System.out.println(a.equals(b)); // true`),
      section('Comparable', 'La clase implementa su orden natural mediante compareTo: negativo, cero o positivo.', `class Alumno implements Comparable<Alumno> {
    int nota;

    public int compareTo(Alumno otro) {
        return Integer.compare(nota, otro.nota);
    }
}`),
      section('Comparator', 'Un comparador independiente permite ordenar por nombre, edad u otro criterio sin cambiar el orden natural.', `Comparator<Alumno> porNombre =
    (x, y) -> x.nombre.compareTo(y.nombre);`),
      section('equals y hashCode', 'Si dos objetos son iguales según equals deben producir el mismo hashCode. Esta regla mantiene correctas HashMap y HashSet.'),
    ],
    mistakes: ['Comparar contenido con ==', 'Restar enteros grandes dentro de compareTo', 'Cambiar equals sin cambiar hashCode', 'Definir un orden que contradice la igualdad sin documentarlo'],
    checklist: ['Decidir si importa identidad o contenido', 'Definir igualdad con campos estables', 'Elegir orden natural y alternativos', 'Probar menor, igual y mayor'],
    remember: '== pregunta si es el mismo objeto; equals pregunta si representa lo mismo; compareTo pregunta cuál va primero.',
  }),
  lesson({
    id: 'diseno-representacion-algoritmos', name: 'Diseño y representación de algoritmos', navName: 'Diseñar algoritmos',
    scope: 'Problema · Pseudocódigo · Diagrama · Prueba de escritorio',
    summary: 'Transforma una necesidad en pasos precisos antes de preocuparte por la sintaxis del lenguaje.',
    pseudocode: 'comprender entradas y salidas\ndividir la solución en pasos\nrepresentar decisiones y ciclos\nprobar con ejemplos', values: ['entrada', 'proceso', 'salida'],
    intro: 'Diseñar un algoritmo significa construir una secuencia finita, precisa y ejecutable de pasos que transforma entradas en salidas. El pseudocódigo, los diagramas de flujo y las pruebas de escritorio permiten corregir la idea antes de convertirla en Java.',
    essentials: [
      { term: 'Entrada', label: 'Datos iniciales', text: 'Información disponible y condiciones que debe cumplir.' },
      { term: 'Proceso', label: 'Transformación', text: 'Decisiones, repeticiones y operaciones necesarias.' },
      { term: 'Salida', label: 'Resultado', text: 'Información que debe producirse y propiedades que debe cumplir.' },
    ],
    sections: [
      section('Especificar el problema', 'Antes de programar se escriben entradas, salidas, restricciones y ejemplos. Una solución correcta responde exactamente esa especificación.'),
      section('Pseudocódigo', 'Debe expresar la lógica sin depender de detalles accidentales de Java.', `buscar(A, objetivo):
  para i desde 0 hasta longitud(A) - 1
    si A[i] = objetivo
      retornar i
  retornar -1`),
      section('Diagrama de flujo', 'Óvalos representan inicio y fin, rectángulos procesos, rombos decisiones y flechas el orden del control. Es útil cuando existen varias ramas.'),
      section('Prueba de escritorio', 'Una tabla registra valores de variables, condiciones y salidas en cada paso. Debe incluir casos comunes y límites.'),
    ],
    mistakes: ['Comenzar por la sintaxis sin entender el problema', 'Escribir pasos ambiguos como procesar datos', 'No definir cuándo termina un ciclo', 'Probar solamente un caso favorable'],
    checklist: ['Escribir entradas y salida esperada', 'Dividir en pasos observables', 'Elegir estructura de datos', 'Probar vacío, uno, repetidos y límites'],
    remember: 'Primero demuestra la idea con pasos claros; después tradúcela al lenguaje de programación.',
  }),
  lesson({
    id: 'correctitud-algoritmos', name: 'Correctitud de algoritmos', navName: 'Correctitud',
    scope: 'Precondición · Postcondición · Invariante · Terminación',
    summary: 'Aprende a justificar por qué un algoritmo entrega el resultado correcto para todas las entradas válidas.',
    pseudocode: 'declarar qué se supone\ndefinir qué se garantiza\nconservar una propiedad durante el proceso\ndemostrar que termina', values: ['pre', 'invariante', 'post'],
    intro: 'Probar correctitud no significa ejecutar muchos ejemplos, sino argumentar que para toda entrada que cumple la precondición el algoritmo termina y satisface su postcondición. Los invariantes conectan el estado inicial con el resultado final.',
    essentials: [
      { term: 'Pre', label: 'Antes', text: 'Condiciones que la entrada debe cumplir para aplicar el algoritmo.' },
      { term: 'Invariante', label: 'Durante', text: 'Propiedad verdadera antes y después de cada iteración.' },
      { term: 'Post', label: 'Después', text: 'Resultado y propiedades garantizadas al terminar.' },
    ],
    sections: [
      section('Correctitud parcial y total', 'La parcial demuestra que, si termina, el resultado es correcto. La total agrega una demostración de terminación.'),
      section('Invariante de búsqueda lineal', 'Antes de revisar el índice i, el objetivo no aparece en las posiciones 0 hasta i - 1.', `for (int i = 0; i < datos.length; i++) {
    if (datos[i] == objetivo) return i;
}
return -1;`),
      section('Inicialización, conservación y cierre', 'Se demuestra que el invariante es cierto al comenzar, permanece tras una iteración y permite concluir la postcondición cuando el ciclo termina.'),
      section('Terminación', 'Una medida variante debe acercarse a un límite: i aumenta hacia length, n disminuye hacia 0 o el rango de búsqueda se reduce.'),
    ],
    mistakes: ['Confundir muchas pruebas con demostración', 'Elegir un invariante que no ayuda a concluir', 'No declarar supuestos de entrada', 'Olvidar justificar la terminación'],
    checklist: ['Escribir precondición y postcondición', 'Proponer una propiedad conservada', 'Probar inicio y mantenimiento', 'Identificar una medida que progresa'],
    remember: 'Las pruebas encuentran errores; la correctitud explica por qué el algoritmo funciona para toda entrada permitida.',
  }),
  lesson({
    id: 'pruebas-depuracion', name: 'Pruebas y depuración', navName: 'Pruebas y depuración',
    scope: 'Casos · Trazas · Debugger · Aserciones',
    summary: 'Diseña casos que revelen errores y sigue el estado del programa hasta encontrar su causa real.',
    pseudocode: 'definir resultado esperado\nejecutar un caso pequeño\ncomparar estado real y esperado\naislar la primera diferencia', values: ['caso', 'traza', 'assert'],
    intro: 'Probar verifica comportamientos esperados con entradas seleccionadas; depurar investiga por qué un resultado real difiere del esperado. Una buena estrategia observa la primera línea donde el estado se vuelve incorrecto, no solamente el síntoma final.',
    essentials: [
      { term: 'Caso', label: 'Entrada y expectativa', text: 'Declara datos iniciales, operación y resultado exacto esperado.' },
      { term: 'Traza', label: 'Estado paso a paso', text: 'Registra variables, condiciones, llamadas y enlaces durante la ejecución.' },
      { term: 'Aserción', label: 'Regla comprobable', text: 'Falla automáticamente cuando una condición que debía cumplirse resulta falsa.' },
    ],
    sections: [
      section('Particiones y límites', 'Se elige un representante de cada grupo de comportamiento y se prueban sus fronteras: vacío, uno, máximo, duplicados y valores inválidos.'),
      section('Aserciones', 'Una prueba debe comparar el resultado con una expectativa concreta, no limitarse a comprobar que el programa no se cerró.', `int resultado = buscar(datos, 7);
assert resultado == 2 : "índice incorrecto";`),
      section('Depuración sistemática', 'Reproduce el error con el caso más pequeño, coloca un punto de interrupción antes del fallo y avanza observando variables y condiciones.'),
      section('Pruebas de regresión', 'Cuando se corrige un error se conserva el caso como prueba. Así el mismo problema no reaparece silenciosamente después.'),
    ],
    mistakes: ['Probar solo el camino feliz', 'Cambiar varias causas al mismo tiempo', 'Imprimir datos sin saber qué se esperaba', 'Eliminar la prueba después de corregir'],
    checklist: ['Preparar vacío, uno y muchos', 'Incluir duplicados y límites', 'Anotar resultado esperado antes de ejecutar', 'Reducir el caso que falla', 'Conservar una prueba de regresión'],
    remember: 'Depurar es encontrar la primera diferencia entre el estado esperado y el estado real.',
  }),
  lesson({
    id: 'fundamentos-backtracking', name: 'Fundamentos de Backtracking', navName: 'Backtracking',
    scope: 'Elegir · Comprobar · Avanzar · Deshacer',
    summary: 'Aprende a explorar decisiones recursivamente, descartar caminos inválidos y volver atrás para probar alternativas.',
    pseudocode: 'si el estado es solución: retornar verdadero\npara cada decisión posible\n  si es válida: elegir y avanzar\n  si no funciona: deshacer\nretornar falso', values: ['elegir', 'explorar', 'deshacer'],
    intro: 'Backtracking es una técnica de búsqueda que construye una solución decisión por decisión. Cuando una elección viola las reglas o ya no puede conducir a una respuesta completa, el algoritmo deshace esa elección y prueba otra alternativa. No vuelve atrás por error: volver atrás es una parte planificada del algoritmo.',
    essentials: [
      { term: 'Elegir', label: 'Cambiar el estado', text: 'Agrega temporalmente una alternativa que cumple las reglas conocidas.' },
      { term: 'Explorar', label: 'Llamada recursiva', text: 'Continúa desde el nuevo estado para comprobar si permite completar la solución.' },
      { term: 'Deshacer', label: 'Restaurar', text: 'Revierte exactamente la elección cuando ese camino no funciona.' },
    ],
    sections: [
      section('Árbol de decisiones', 'Cada nivel representa una decisión y cada rama una alternativa. Una hoja puede ser una solución, un estado inválido o un camino sin opciones. Backtracking evita seguir una rama apenas sabe que ya no sirve.'),
      section('El patrón completo', 'El estado se modifica antes de la llamada recursiva y debe quedar exactamente como estaba después de volver si no se encontró una solución.', `static boolean resolver(int paso) {
    if (paso == META) return true;

    for (int opcion = 0; opcion < LIMITE; opcion++) {
        if (esValida(paso, opcion)) {
            elegir(paso, opcion);
            if (resolver(paso + 1)) return true;
            deshacer(paso, opcion);
        }
    }
    return false;
}`),
      section('Validar antes de avanzar', 'El método esValida poda decisiones que ya rompen una restricción. En N-Reinas comprueba columna y diagonales; en Sudoku revisa fila, columna y subcuadro; en un laberinto evita muros y celdas visitadas.'),
      section('Encontrar una o todas las soluciones', 'Para detenerse en la primera solución se retorna true. Para enumerarlas todas se registra cada solución y se continúa deshaciendo para explorar las demás ramas.', `static void combinaciones(int paso) {
    if (paso == META) {
        guardarSolucion();
        return;
    }
    // elegir, explorar y deshacer cada opción
}`),
      section('Costo y poda', 'En el peor caso puede explorar una cantidad exponencial de estados. Una validación temprana, un buen orden de decisiones y restricciones fuertes reducen enormemente el espacio recorrido.'),
    ],
    mistakes: ['Olvidar deshacer una elección fallida', 'Modificar estado compartido sin restaurarlo', 'Aceptar un estado parcial como solución completa', 'Validar demasiado tarde y explorar ramas imposibles', 'Confundir backtracking con probar valores al azar'],
    checklist: ['Definir cómo reconocer una solución completa', 'Enumerar las decisiones posibles', 'Escribir la condición de validez', 'Aplicar una elección antes de llamar', 'Restaurar el estado al regresar'],
    remember: 'El patrón es elegir, explorar y deshacer. Si al regresar el estado no quedó igual que antes de elegir, el backtracking está incompleto.',
  }),
  lesson({
    id: 'fundamentos-busqueda-binaria', name: 'Fundamentos de Búsqueda Binaria', navName: 'Búsqueda binaria',
    scope: 'Datos ordenados · Mitad · Intervalo · O(log n)',
    summary: 'Encuentra valores reduciendo a la mitad un intervalo ordenado en cada comparación.',
    pseudocode: 'izquierda ← 0, derecha ← n - 1\nmientras izquierda ≤ derecha\n  medio ← izquierda + (derecha - izquierda) / 2\n  comparar y descartar una mitad\nretornar -1', values: ['izquierda', 'medio', 'derecha'],
    intro: 'La búsqueda binaria localiza un valor dentro de datos ordenados. Compara el objetivo con el elemento central y utiliza el orden para descartar de una vez la mitad que no puede contenerlo. Por eso necesita muchas menos comparaciones que un recorrido lineal cuando n crece.',
    essentials: [
      { term: 'Orden', label: 'Precondición', text: 'Los datos deben estar ordenados según el mismo criterio utilizado para comparar.' },
      { term: 'Mitad', label: 'Decisión', text: 'El valor central determina cuál de los dos intervalos todavía puede contener el objetivo.' },
      { term: 'O(log n)', label: 'Reducción', text: 'Cada comparación divide aproximadamente por dos la cantidad de candidatos.' },
    ],
    sections: [
      section('Intervalo de búsqueda', 'izquierda y derecha delimitan las posiciones donde el objetivo todavía podría encontrarse. El intervalo inicial incluye desde 0 hasta length - 1.'),
      section('Versión iterativa completa', 'Si el centro es menor que el objetivo se descarta la mitad izquierda; si es mayor se descarta la mitad derecha.', `static int buscar(int[] datos, int objetivo) {
    int izquierda = 0;
    int derecha = datos.length - 1;

    while (izquierda <= derecha) {
        int medio = izquierda + (derecha - izquierda) / 2;

        if (datos[medio] == objetivo) return medio;
        if (datos[medio] < objetivo) izquierda = medio + 1;
        else derecha = medio - 1;
    }
    return -1;
}`),
      section('Por qué termina', 'Cuando el centro no contiene el objetivo se elimina también esa posición usando medio + 1 o medio - 1. El intervalo se hace estrictamente más pequeño hasta quedar vacío.'),
      section('Invariante', 'Antes de cada iteración, si el objetivo existe, se encuentra entre izquierda y derecha. Cada comparación conserva esa propiedad al descartar solamente valores imposibles.'),
      section('Variantes útiles', 'El mismo principio permite encontrar la primera aparición, la última aparición o la primera posición donde podría insertarse un valor sin romper el orden.'),
    ],
    mistakes: ['Aplicarla sobre datos desordenados', 'Usar derecha = length en un intervalo inclusivo', 'Actualizar izquierda = medio y no reducir el intervalo', 'Olvidar el caso de arreglo vacío', 'Suponer que siempre devuelve la primera repetición'],
    checklist: ['Confirmar que los datos están ordenados', 'Definir si los límites son inclusivos', 'Calcular medio dentro del intervalo', 'Eliminar medio al actualizar un límite', 'Probar vacío, uno, ausente y repetidos'],
    remember: 'La búsqueda binaria no revisa ambas mitades: usa el orden para demostrar que una de ellas puede descartarse por completo.',
  }),
  lesson({
    id: 'fundamentos-divide-venceras', name: 'Fundamentos de Divide y Vencerás', navName: 'Divide y vencerás',
    scope: 'Dividir · Resolver · Combinar · Recurrencia',
    summary: 'Resuelve problemas grandes separándolos en subproblemas pequeños, solucionándolos y combinando sus respuestas.',
    pseudocode: 'si el problema es pequeño: resolver directo\ndividir en subproblemas\nresolver cada parte\ncombinar los resultados', values: ['dividir', 'resolver', 'combinar'],
    intro: 'Divide y Vencerás es una estrategia que transforma un problema en subproblemas más pequeños del mismo tipo. Cada parte se resuelve normalmente de forma recursiva y luego sus resultados se combinan para obtener la respuesta original. La división debe reducir realmente el tamaño y la combinación debe conservar toda la información necesaria.',
    essentials: [
      { term: 'Dividir', label: 'Separar', text: 'Crea subproblemas más pequeños y bien definidos del mismo problema general.' },
      { term: 'Resolver', label: 'Conquistar', text: 'Aplica recursivamente el algoritmo hasta alcanzar casos pequeños y directos.' },
      { term: 'Combinar', label: 'Reconstruir', text: 'Une las respuestas parciales para formar la solución del problema original.' },
    ],
    sections: [
      section('Caso base y reducción', 'El caso base resuelve directamente una entrada mínima. Cada división debe acercarse a él; de lo contrario, la recursión no termina.'),
      section('Ejemplo: encontrar el máximo', 'Se obtiene el máximo de cada mitad y luego se comparan únicamente esos dos resultados.', `static int maximo(int[] datos, int inicio, int fin) {
    if (inicio == fin) return datos[inicio];

    int medio = inicio + (fin - inicio) / 2;
    int maxIzq = maximo(datos, inicio, medio);
    int maxDer = maximo(datos, medio + 1, fin);
    return Math.max(maxIzq, maxDer);
}`),
      section('Ejemplo: Merge Sort', 'Divide el arreglo hasta obtener partes de un elemento. Al regresar, mezcla dos mitades ya ordenadas. La combinación realiza trabajo lineal en cada nivel.', `static void mergeSort(int[] datos, int inicio, int fin) {
    if (inicio >= fin) return;
    int medio = inicio + (fin - inicio) / 2;
    mergeSort(datos, inicio, medio);
    mergeSort(datos, medio + 1, fin);
    mezclar(datos, inicio, medio, fin);
}`),
      section('Recurrencias y complejidad', 'El costo se expresa considerando cuántos subproblemas se crean, cuánto disminuye su tamaño y cuánto trabajo exige dividir o combinar. Merge Sort sigue T(n) = 2T(n/2) + O(n), que produce O(n log n).'),
      section('Diferencia con otras técnicas', 'Divide y Vencerás resuelve partes independientes y combina sus respuestas. Backtracking explora alternativas y deshace decisiones. Programación dinámica guarda resultados cuando los subproblemas se repiten.'),
    ],
    mistakes: ['Crear partes que no reducen el problema', 'Olvidar combinar las respuestas parciales', 'Solapar subproblemas repetidamente sin considerar memoización', 'Perder elementos al calcular los límites', 'Asumir que toda recursión es Divide y Vencerás'],
    checklist: ['Definir un caso base directo', 'Explicar cómo disminuye cada parte', 'Resolver todas las partes necesarias', 'Diseñar una combinación correcta', 'Escribir y simplificar la recurrencia'],
    remember: 'La estrategia está completa solamente cuando explica cómo dividir, cómo resolver las partes y cómo reconstruir la respuesta original.',
  }),
];

export const foundationLessonCatalog = foundationLessons.map(item => ({
  id: item.id,
  name: item.name,
  navName: item.navName,
  category: 'Fundamentos',
  type: 'foundation',
  complexity: item.scope,
  description: item.summary,
  code: item.pseudocode,
  values: item.values,
}));

export const foundationLessonsById = Object.fromEntries(foundationLessons.map(item => [item.id, item]));
