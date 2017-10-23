import PopupOverlay from '../organisms/PopupOverlay';

class PopupFloatEl extends PopupOverlay
{

    static defaultProps = {
        style: {
            position: 'absolute',
            right: 'auto'
        },
        name: 'float'
    };

    update(top, left, className)
    {
        this.setState({
            top,
            left,
            className
        });
    }

    componentWillReceiveProps(nextProps)
    {
        this.isNeedUpdate = true;
    }

    componentDidUpdate()
    {
        if (this.isNeedUpdate) {
            const params = this.props.refCb();
            if (params) {
                this.update.apply(this, params);
            }
            this.isNeedUpdate = false;
        }
    }
}

export default PopupFloatEl;
