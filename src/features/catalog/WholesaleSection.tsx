import { Link } from 'react-router-dom'
import { Icon } from '../../components/store/Icon'
export function WholesaleSection() {
  return (
    <section className="sf-wholesale-section">
      <div>
        <span className="sf-eyebrow">PARA TU NEGOCIO O TU PRÓXIMA OBRA</span>
        <h2>
          Precios por volumen,
          <br />
          según tu producto.
        </h2>
        <p>
          Algunos productos tienen precios por cantidad. Elige tu presentación y
          descubre el escalón que se ajusta a tu compra.
        </p>
        <Link className="button sf-yellow" to="/catalogo?mayorista=1">
          Explorar precios por mayor
          <Icon name="arrow" />
        </Link>
      </div>
      <div className="sf-wholesale-steps">
        <div>
          <span>01</span>
          <p>
            Elige el producto<small>Encuentra lo que necesitas.</small>
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            Selecciona la presentación
            <small>Compara unidad, caja o embalaje.</small>
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            Revisa tu precio por cantidad
            <small>Cálculo claro, antes de agregar.</small>
          </p>
        </div>
      </div>
    </section>
  )
}
